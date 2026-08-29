import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as argon2 from 'argon2';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/errors';
import { EmailService } from '../../services/email/resend';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeypulseforauth123!@#';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshsupersecretjwtkeypulseforauth123!@#';

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  /**
   * Register a new user and send verification email.
   */
  public static async register(email: string, password: string, fullName: string, roleName: 'MANAGER' | 'LEAD' | 'RECRUITER' = 'RECRUITER') {
    // 1. Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email address already exists.', 400, 'USER_EXISTS');
    }

    // 2. Hash password with Argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // 3. Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        roleName,
      },
    });

    // 4. Create verification token
    const tokenStr = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({
      data: {
        token: tokenStr,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
      },
    });

    // 5. Send verification email
    await EmailService.sendEmailVerification(email, tokenStr);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleName: user.roleName,
    };
  }

  /**
   * Log in user, verify credentials, create session, and issue access + refresh tokens.
   */
  public static async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email, user.roleName, user.isEmailVerified);

    // Save refresh token to db
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleName: user.roleName,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  }

  /**
   * Log out, invalidate active refresh token and current user session.
   */
  public static async logout(refreshToken: string, userId: string) {
    // Revoke refresh token
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId },
      data: { isRevoked: true },
    });

    // Terminate all sessions for the user
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  /**
   * Refreshes access token and rotates the refresh token.
   */
  public static async refreshSession(oldRefreshTokenStr: string) {
    // Find refresh token in DB
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshTokenStr },
      include: { user: true },
    });

    if (!dbToken || dbToken.isRevoked || dbToken.isUsed || dbToken.expiresAt < new Date()) {
      // Security breach detected: revoke all user sessions if old refresh token is reused
      if (dbToken) {
        await prisma.refreshToken.updateMany({
          where: { userId: dbToken.userId },
          data: { isRevoked: true },
        });
        await prisma.session.updateMany({
          where: { userId: dbToken.userId },
          data: { isActive: false },
        });
      }
      throw new AppError('Session expired or security breach detected. Please log in again.', 401, 'REFRESH_TOKEN_EXPIRED');
    }

    // Mark token as used
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { isUsed: true },
    });

    const user = dbToken.user;
    if (!user.isActive) {
      throw new AppError('User account deactivated.', 401, 'USER_DEACTIVATED');
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.roleName,
      user.isEmailVerified
    );

    // Save new refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleName: user.roleName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  /**
   * Verify email address using verification token.
   */
  public static async verifyEmail(tokenStr: string) {
    const dbToken = await prisma.emailVerificationToken.findUnique({
      where: { token: tokenStr },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired verification token.', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: dbToken.userId },
      data: { isEmailVerified: true },
    });

    // Delete the token
    await prisma.emailVerificationToken.delete({
      where: { id: dbToken.id },
    });

    return true;
  }

  /**
   * Password Reset Trigger: send token link via email.
   */
  public static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Silent success for security obfuscation (prevent email enumeration)
      return true;
    }

    const tokenStr = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        token: tokenStr,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour expiry
      },
    });

    await EmailService.sendPasswordReset(email, tokenStr);
    return true;
  }

  /**
   * Commit password reset after token validation.
   */
  public static async resetPassword(tokenStr: string, newPassword: string) {
    const dbToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenStr },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired password reset token.', 400, 'INVALID_RESET_TOKEN');
    }

    // Hash new password
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 4,
    });

    // Update password
    await prisma.user.update({
      where: { id: dbToken.userId },
      data: { passwordHash },
    });

    // Delete token
    await prisma.passwordResetToken.delete({
      where: { id: dbToken.id },
    });

    // Invalidate user sessions
    await prisma.session.updateMany({
      where: { userId: dbToken.userId, isActive: true },
      data: { isActive: false },
    });
  }

  /**
   * Helper to generate JWT tokens.
   */
  private static async generateTokens(userId: string, email: string, roleName: string, isEmailVerified: boolean) {
    const accessToken = jwt.sign(
      { userId, email, roleName, isEmailVerified },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, jti: crypto.randomBytes(16).toString('hex') },
      JWT_REFRESH_SECRET,
      { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
    );

    return { accessToken, refreshToken };
  }
}
