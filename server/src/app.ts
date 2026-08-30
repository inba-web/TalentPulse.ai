import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load config
dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.routes';
import studentsRouter from './modules/students/students.routes';
import companiesRouter from './modules/companies/companies.routes';
import jobsRouter from './modules/jobs/jobs.routes';
import atsRouter from './modules/ats/ats.routes';
import reportsRouter from './modules/reports/reports.routes';
import searchRouter from './modules/search/search.routes';
import auditRouter from './modules/audit/audit.routes';
import drivesRouter from './modules/drives/drives.routes';
import notificationsRouter from './modules/notifications/notifications.routes';

const app = express();

// Security Hardening Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file hosting for local uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Correlation ID helper middleware
app.use((req, res, next) => {
  (req as any).requestId = Math.random().toString(36).substring(2, 15);
  next();
});

// Swagger documentation route if needed (we can add a simple swagger config)
// API routes mount
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/ats', atsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/search', searchRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/drives', drivesRouter);
app.use('/api/notifications', notificationsRouter);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The resource at ${req.originalUrl} could not be found.`,
      requestId: (req as any).requestId,
    },
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
