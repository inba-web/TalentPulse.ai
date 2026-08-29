import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId || Math.random().toString(36).substring(2, 15);
  
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred on the server.';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  } else if (
    err?.name === 'ZodError' ||
    err?.constructor?.name === 'ZodError' ||
    Array.isArray(err?.issues) ||
    Array.isArray(err?.errors)
  ) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const issues = err.issues || err.errors || [];
    if (issues.length > 0) {
      message = issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ');
    } else {
      message = err.message || 'Validation failed';
    }
  } else if (err.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'A record with these details already exists.';
  } else {
    // Unhandled system exceptions
    logger.error({ err, path: req.path, method: req.method, requestId }, 'Unhandled Application Exception');
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      requestId,
    },
  });
};
