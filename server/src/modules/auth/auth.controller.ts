import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { catchAsync, AppError } from '../../utils/errors';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validator';
import { prisma } from '../../config/db';
import * as argon2 from 'argon2';
import { AuthenticatedRequest } from '../../middleware/auth';

const REFRESH_COOKIE_NAME = 'refresh_token';
const ACCESS_COOKIE_NAME = 'access_token';

const isProduction = process.env.NODE_ENV === 'production';

// Helpers to set secure cookies
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE_NAME);
  res.clearCookie(REFRESH_COOKIE_NAME);
};

export class AuthController {
  public static register = catchAsync(async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);
    
    const user = await AuthService.register(data.email, data.password, data.fullName, data.roleName);
    
    await AuditService.log({
      action: 'USER_REGISTERED',
      actorId: user.id,
      entity: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.roleName },
      ipAddress: req.ip,
      requestId: (req as any).requestId,
    });

    res.status(201).json({
      success: true,
      data: { user },
    });
  });

  public static login = catchAsync(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    
    const result = await AuthService.login(data.email, data.password, req.ip, req.headers['user-agent']);
    
    setAuthCookies(res, result.accessToken, result.refreshToken);

    await AuditService.log({
      action: 'LOGIN',
      actorId: result.user.id,
      entity: 'User',
      entityId: result.user.id,
      ipAddress: req.ip,
      requestId: (req as any).requestId,
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  public static logout = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    
    if (refreshToken && req.user) {
      await AuthService.logout(refreshToken, req.user.id);
      
      await AuditService.log({
        action: 'LOGOUT',
        actorId: req.user.id,
        entity: 'User',
        entityId: req.user.id,
        ipAddress: req.ip,
        requestId: req.requestId,
      });
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  public static refresh = catchAsync(async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!oldRefreshToken) {
      throw new AppError('Refresh token is missing.', 401, 'UNAUTHORIZED');
    }

    const result = await AuthService.refreshSession(oldRefreshToken);
    
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  public static verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      throw new AppError('Verification token is required.', 400, 'INVALID_TOKEN');
    }

    await AuthService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully. You can now log in.',
    });
  });

  public static forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const data = forgotPasswordSchema.parse(req.body);
    
    await AuthService.forgotPassword(data.email);

    res.status(200).json({
      success: true,
      message: 'If the email matches an active account, password reset instructions have been sent.',
    });
  });

  public static resetPassword = catchAsync(async (req: Request, res: Response) => {
    const data = resetPasswordSchema.parse(req.body);

    await AuthService.resetPassword(data.token, data.password);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  });

  public static changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const data = changePasswordSchema.parse(req.body);
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const valid = await argon2.verify(user.passwordHash, data.currentPassword);
    if (!valid) {
      throw new AppError('Invalid current password.', 400, 'INVALID_PASSWORD');
    }

    // Hash and save new password
    const passwordHash = await argon2.hash(data.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 4,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke other user sessions
    await prisma.session.updateMany({
      where: { userId, NOT: { id: (req as any).sessionId } },
      data: { isActive: false },
    });

    await AuditService.log({
      action: 'PASSWORD_CHANGE',
      actorId: userId,
      entity: 'User',
      entityId: userId,
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  });

  public static me = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }
    
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  });
}
