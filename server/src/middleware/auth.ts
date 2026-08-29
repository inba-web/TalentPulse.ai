import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AppError, catchAsync } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeypulseforauth123!@#';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    roleName: string;
    isEmailVerified: boolean;
  };
  requestId?: string;
}

/**
 * Middleware to enforce authentication on routes.
 * Checks Authorization header or cookies for access_token.
 */
export const requireAuth = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token = '';

  // 1. Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Check cookies
  else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    throw new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      roleName: string;
      isEmailVerified: boolean;
    };

    // Verify session still active in db
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!session || !session.user || !session.user.isActive) {
      throw new AppError('Session expired or user account is deactivated.', 401, 'SESSION_EXPIRED');
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      roleName: session.user.roleName,
      isEmailVerified: session.user.isEmailVerified,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access token expired. Please refresh your session.', 401, 'ACCESS_TOKEN_EXPIRED');
    }
    throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
  }
});

/**
 * Middleware to enforce permission checks, incorporating RBAC role permissions
 * and custom user overrides (UserPermission).
 */
export const hasPermission = (permissionCode: string) => {
  return catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const { id: userId, roleName } = req.user;

    // Admin has superuser status and bypasses permission checks
    if (roleName === 'ADMIN') {
      return next();
    }

    // 1. Check custom overrides in UserPermission table
    const customPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permissionCode: {
          userId,
          permissionCode,
        },
      },
    });

    if (customPermission !== null) {
      if (customPermission.granted) {
        // Explicitly granted override
        return next();
      } else {
        // Explicitly denied override
        throw new AppError('Access Denied. Permission revoked by administrator.', 403, 'FORBIDDEN');
      }
    }

    // 2. Check role permissions
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleName_permissionCode: {
          roleName: roleName as any,
          permissionCode,
        },
      },
    });

    if (rolePermission) {
      return next();
    }

    throw new AppError('Access Denied. You do not have the required permission.', 403, 'FORBIDDEN');
  });
};
