import { Resend } from 'resend';
import { logger } from '../../utils/logger';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'inbafreakz@gmail.com';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Branded CSS Header and Footer Styles
const getEmailWrapper = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #2563EB;
      padding: 24px;
      text-align: center;
    }
    .logo-text {
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      color: #475569;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background-color: #2563EB;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
    }
    .footer {
      background-color: #F8FAFC;
      padding: 24px;
      border-top: 1px solid #E2E8F0;
      text-align: center;
      font-size: 12px;
      color: #94A3B8;
    }
    .footer a {
      color: #64748B;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo-text">TalentPulse.ai</h1>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>TalentPulse.ai — AI-Powered Placement Intelligence Platform</p>
      <p>&copy; ${new Date().getFullYear()} TalentPulse.ai. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export class EmailService {
  public static async sendMail(to: string, subject: string, bodyContent: string): Promise<boolean> {
    const html = getEmailWrapper(subject, bodyContent);

    if (!resend) {
      logger.warn(`Resend API key is not configured. Logging email instead to console. Subject: "${subject}", To: "${to}"`);
      logger.info(`Email HTML Content Preview:\n${html}`);
      return true;
    }

    try {
      const response = await resend.emails.send({
        from: `TalentPulse.ai <${emailFrom}>`,
        to,
        subject,
        html,
      });

      if (response.error) {
        logger.error({ error: response.error }, 'Resend email sending failure');
        return false;
      }

      logger.info({ to, subject, id: response.data?.id }, 'Resend email sent successfully');
      return true;
    } catch (error) {
      logger.error({ error }, 'Unexpected email sending failure');
      return false;
    }
  }

  public static async sendWelcome(to: string, name: string) {
    const body = `
      <h2 class="title">Welcome, ${name}!</h2>
      <p class="text">Your account has been successfully set up on <strong>TalentPulse.ai</strong>, the AI-Powered Placement Intelligence Platform.</p>
      <p class="text">Log in to your workspace using your institutional email address to start managing placements and candidate analyses.</p>
    `;
    return this.sendMail(to, 'Welcome to TalentPulse.ai', body);
  }

  public static async sendEmailVerification(to: string, token: string) {
    // In local development, we direct to local port, in prod we would use config
    const verifyLink = `http://localhost:3000/verify-email?token=${token}`;
    const body = `
      <h2 class="title">Verify Your Email Address</h2>
      <p class="text">Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
      <div style="margin-bottom: 24px;"><a href="${verifyLink}" class="btn">Verify Email Address</a></div>
      <p class="text" style="font-size: 13px; color: #64748B;">If the button above does not work, copy and paste this link in your browser: <br/>${verifyLink}</p>
    `;
    return this.sendMail(to, 'Verify Your Email — TalentPulse.ai', body);
  }

  public static async sendPasswordReset(to: string, token: string) {
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    const body = `
      <h2 class="title">Reset Your Password</h2>
      <p class="text">We received a request to reset your password. Click the button below to choose a new password:</p>
      <div style="margin-bottom: 24px;"><a href="${resetLink}" class="btn">Reset Password</a></div>
      <p class="text" style="font-size: 13px; color: #64748B;">If you did not request a password reset, you can safely ignore this email.</p>
    `;
    return this.sendMail(to, 'Reset Your Password — TalentPulse.ai', body);
  }

  public static async sendPlacementApprovalRequest(to: string, jobTitle: string, companyName: string, submitter: string) {
    const body = `
      <h2 class="title">Placement Job Pending Approval</h2>
      <p class="text">A new placement opportunity has been created and forwarded to Admin governance:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0; font-weight: 600;">Job Title:</td><td>${jobTitle}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Company:</td><td>${companyName}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Created By:</td><td>${submitter}</td></tr>
      </table>
      <div style="margin-bottom: 24px;"><a href="http://localhost:3000/approvals" class="btn">Review Approval Request</a></div>
    `;
    return this.sendMail(to, `Placement Job Approval Request: ${companyName}`, body);
  }

  public static async sendPlacementApproved(to: string, jobTitle: string, companyName: string, comment?: string) {
    const body = `
      <h2 class="title">Placement Job Opportunity Approved</h2>
      <p class="text">The placement opportunity for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been approved and published to the Recruiter dashboard.</p>
      ${comment ? `<p class="text"><strong>Admin Comment:</strong> ${comment}</p>` : ''}
    `;
    return this.sendMail(to, `Placement Job Approved: ${companyName}`, body);
  }

  public static async sendPlacementRejected(to: string, jobTitle: string, companyName: string, comment?: string) {
    const body = `
      <h2 class="title">Placement Job Opportunity Rejected</h2>
      <p class="text">The placement opportunity for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been rejected by the administrator.</p>
      ${comment ? `<p class="text"><strong>Rejection Comment:</strong> ${comment}</p>` : ''}
    `;
    return this.sendMail(to, `Placement Job Rejected: ${companyName}`, body);
  }

  public static async sendStudentImportCompleted(to: string, totalCount: number, successCount: number, errorCount: number) {
    const body = `
      <h2 class="title">Student Database Import Completed</h2>
      <p class="text">The spreadsheet upload process has finished execution:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0; font-weight: 600;">Total Rows Checked:</td><td>${totalCount}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #16A34A;">Successfully Imported:</td><td>${successCount}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #DC2626;">Invalid/Duplicate Rows:</td><td>${errorCount}</td></tr>
      </table>
      <div style="margin-bottom: 24px;"><a href="http://localhost:3000/students" class="btn">View Student Dashboard</a></div>
    `;
    return this.sendMail(to, 'Student Import Completed', body);
  }

  public static async sendStudentTerminated(to: string, studentName: string, rollNumber: string, reason: string) {
    const body = `
      <h2 class="title">Student Terminated from Placements</h2>
      <p class="text">Student <strong>${studentName}</strong> (Roll: ${rollNumber}) has been terminated from placement eligibility by Admin governance.</p>
      <p class="text"><strong>Reason:</strong> ${reason}</p>
    `;
    return this.sendMail(to, `Student Placement Eligibility Terminated — ${rollNumber}`, body);
  }

  public static async sendStudentTerminationRevoked(to: string, studentName: string, rollNumber: string) {
    const body = `
      <h2 class="title">Placement Eligibility Reinstated</h2>
      <p class="text">The placement termination for student <strong>${studentName}</strong> (Roll: ${rollNumber}) has been revoked. The student is now back to eligible status.</p>
    `;
    return this.sendMail(to, `Student Placement Eligibility Reinstated — ${rollNumber}`, body);
  }
}
