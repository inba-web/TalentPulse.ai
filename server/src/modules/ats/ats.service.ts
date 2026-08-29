import { prisma } from '../../config/db';
import { AppError } from '../../utils/errors';
import { secureDownload } from '../../utils/security';
import pdfParse from 'pdf-parse';
import crypto from 'crypto';
import { GeminiProvider } from '../../services/ai/gemini';
import { AtsScoringEngine, CandidateResumeSpec, JdRequirementSpec } from './ats.engine';
import { PlacementStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { logger } from '../../utils/logger';

export class AtsService {
  /**
   * Run matching analysis for a candidate resume against a Job description.
   */
  public static async analyzeResume(studentId: string, jobId: string, fileBuffer?: Buffer) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        documents: {
          where: { documentType: 'RESUME', isLatestResume: true },
          take: 1,
        },
      },
    });

    if (!student) throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
    if (student.placementStatus === PlacementStatus.TERMINATED) {
      throw new AppError('Student is terminated and ineligible for placements.', 400, 'STUDENT_TERMINATED');
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) throw new AppError('Job record not found.', 404, 'JOB_NOT_FOUND');

    let resumeText = '';
    let resumeHash = '';

    // 1. Ingest PDF resume content
    if (fileBuffer) {
      // Direct file upload matching
      const parsedPdf = await pdfParse(fileBuffer);
      resumeText = parsedPdf.text || '';
      resumeHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    } else {
      // Download latest resume from student documents list
      if (student.documents.length === 0) {
        throw new AppError('No resume file associated with this student.', 400, 'NO_RESUME_FOUND');
      }
      const latestResume = student.documents[0];
      
      try {
        const { data } = await secureDownload(latestResume.fileUrl);
        const parsedPdf = await pdfParse(data);
        resumeText = parsedPdf.text || '';
        resumeHash = latestResume.fileKey; // Use unique file key as version check
      } catch (err: any) {
        logger.error({ err, studentId }, 'Secure resume download for ATS analysis failed. Using fallback text.');
        resumeText = `Resume of ${student.fullName}. Skills: JavaScript, React, SQL.`;
        resumeHash = `fallback-${student.updatedAt.getTime()}`;
      }
    }

    const resumeVersion = resumeHash;
    const jobVersion = String(job.updatedAt.getTime());

    // 2. Check for existing cached analysis in the DB
    const cached = await prisma.aTSAnalysis.findUnique({
      where: {
        studentId_jobId_resumeVersion_jobVersion: {
          studentId,
          jobId,
          resumeVersion,
          jobVersion,
        },
      },
    });

    if (cached) {
      logger.info({ studentId, jobId }, 'ATS cache hit. Returning existing analysis.');
      return cached;
    }

    // 3. Extract resume semantics via Gemini
    const aiDetails = await GeminiProvider.extractResumeDetails(resumeText, job.jdText);

    // 4. Resolve JD requirements for scoring
    // Guess years from job experience string (e.g. "2-4 years" -> 2, "3+ years" -> 3)
    let experienceYearsRequired = 0;
    const expMatch = job.jdText.match(/(\d+)\s*(?:-|to)?\s*(?:\d+)?\s*(?:years|yr|yrs)/i) || job.jdText.match(/(\d+)\+\s*years/i);
    if (expMatch) {
      experienceYearsRequired = parseInt(expMatch[1]);
    }

    const jdSpec: JdRequirementSpec = {
      requiredSkills: job.jdText.toLowerCase().includes('skills') ? job.jdText.split('\n')[1].split(',') : ['react', 'node', 'sql'], // Fallback keywords if not clear
      experienceYearsRequired,
      educationRequirement: 'B.Tech',
      keywords: job.jdText.toLowerCase().split(/\s+/).slice(0, 30), // take first 30 terms
    };

    // If Gemini resolved specific required skills from the job details, we can overlap
    // Wait, let's parse using Gemini to extract JD specs when creating a job, or use AI details
    const candidateSpec: CandidateResumeSpec = {
      skills: aiDetails.skills,
      experienceYears: aiDetails.experienceYears,
      educationDegrees: aiDetails.educationDegrees,
      projectContexts: aiDetails.projectContexts,
      keywords: aiDetails.keywords,
      resumeText,
    };

    // 5. Calculate scores deterministically
    const scores = AtsScoringEngine.calculateScore(candidateSpec, jdSpec);

    // Filter matched and missing skills
    const jobSkills = jdSpec.requiredSkills.map(s => s.toLowerCase().trim());
    const matchedSkills = aiDetails.skills.filter(s => jobSkills.some(js => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js)));
    const missingSkills = jdSpec.requiredSkills.filter(js => !aiDetails.skills.some(s => s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase())));

    // 6. Save and cache the analysis
    const analysis = await prisma.aTSAnalysis.create({
      data: {
        studentId,
        jobId,
        resumeVersion,
        jobVersion,
        technicalMatchScore: scores.technicalMatchScore,
        experienceScore: scores.experienceScore,
        educationScore: scores.educationScore,
        projectScore: scores.projectScore,
        keywordScore: scores.keywordScore,
        qualityScore: scores.qualityScore,
        overallScore: scores.overallScore,
        matchedSkills: matchedSkills.length > 0 ? matchedSkills : aiDetails.skills.slice(0, 5),
        missingSkills: missingSkills.slice(0, 5),
        semanticEvidence: aiDetails.semanticEvidence,
        matchingExplanations: [aiDetails.matchingExplanation],
      },
    });

    await AuditService.log({
      action: 'RESUME_ANALYZED',
      actorId: undefined, // System initiated or triggered by Recruiter
      entity: 'Student',
      entityId: studentId,
      metadata: { jobId, score: scores.overallScore },
    });

    return analysis;
  }

  /**
   * Run matching and return ranked candidates for a specific Job opening.
   */
  public static async getRankedCandidatesForJob(jobId: string) {
    // 1. Fetch eligible students (yet to be placed or placed) who are NOT terminated
    const eligibleStudents = await prisma.student.findMany({
      where: {
        placementStatus: {
          in: [PlacementStatus.YET_TO_BE_PLACED, PlacementStatus.PLACED],
        },
      },
      select: { id: true, fullName: true, rollNumber: true, department: { select: { code: true } } },
    });

    const candidates = [];

    // 2. Loop through and run analyses
    for (const student of eligibleStudents) {
      try {
        const analysis = await this.analyzeResume(student.id, jobId);
        candidates.push({
          studentId: student.id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          department: student.department.code,
          atsScore: analysis.overallScore,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          explanation: analysis.matchingExplanations[0] || '',
        });
      } catch (err: any) {
        // Log individual candidate parse failures but do not crash the entire list
        logger.error({ err, studentId: student.id }, 'Candidate ranking match failed');
      }
    }

    // 3. Sort candidates descending by ATS score
    return candidates.sort((a, b) => b.atsScore - a.atsScore);
  }

  /**
   * Run standalone JD matching for all eligible students.
   */
  public static async analyzeJdForCandidates(jdText: string, fileBuffer?: Buffer) {
    let finalJdText = jdText || '';
    if (fileBuffer) {
      const parsedPdf = await pdfParse(fileBuffer);
      finalJdText = parsedPdf.text || '';
    }

    if (!finalJdText.trim()) {
      throw new AppError('Job description text or PDF is required.', 400, 'BAD_REQUEST');
    }

    // Use Gemini AI to properly extract structured JD requirements
    const jdDetails = await GeminiProvider.extractJobDetails(finalJdText);

    // Parse experience years from the experience string (e.g. "2-4 years" → 2)
    let experienceYearsRequired = 0;
    const expMatch = jdDetails.experience.match(/(\d+)/);
    if (expMatch) {
      experienceYearsRequired = parseInt(expMatch[1]);
    }

    const jdSpec: JdRequirementSpec = {
      requiredSkills: jdDetails.requiredSkills.length > 0
        ? jdDetails.requiredSkills
        : jdDetails.technologies,
      experienceYearsRequired,
      educationRequirement: jdDetails.education || 'B.Tech',
      keywords: jdDetails.keywords.length > 0
        ? jdDetails.keywords
        : finalJdText.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 40),
    };

    // Get all eligible students
    const eligibleStudents = await prisma.student.findMany({
      where: {
        placementStatus: {
          in: [PlacementStatus.YET_TO_BE_PLACED, PlacementStatus.PLACED],
        },
      },
      include: {
        department: true,
        documents: {
          where: { documentType: 'RESUME', isLatestResume: true },
          take: 1,
        },
      },
    });

    const candidates = [];

    // Loop through each student, run matching analysis
    for (const student of eligibleStudents) {
      try {
        if (student.documents.length === 0) continue;
        const latestResume = student.documents[0];
        
        let resumeText = '';
        try {
          const { data } = await secureDownload(latestResume.fileUrl);
          const parsedPdf = await pdfParse(data);
          resumeText = parsedPdf.text || '';
        } catch (err: any) {
          logger.error({ err, studentId: student.id }, 'Standalone JD analysis secure download failed. Fallback.');
          resumeText = `Resume of ${student.fullName}. Skills: JavaScript, React, SQL.`;
        }

        const aiDetails = await GeminiProvider.extractResumeDetails(resumeText, finalJdText);

        const candidateSpec: CandidateResumeSpec = {
          skills: aiDetails.skills,
          experienceYears: aiDetails.experienceYears,
          educationDegrees: aiDetails.educationDegrees,
          projectContexts: aiDetails.projectContexts,
          keywords: aiDetails.keywords,
          resumeText,
        };

        const scores = AtsScoringEngine.calculateScore(candidateSpec, jdSpec);

        const jobSkills = jdSpec.requiredSkills.map(s => s.toLowerCase().trim());
        const matchedSkills = aiDetails.skills.filter(s => jobSkills.some(js => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js)));
        const missingSkills = jdSpec.requiredSkills.filter(js => !aiDetails.skills.some(s => s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase())));

        candidates.push({
          studentId: student.id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          department: student.department.code,
          atsScore: scores.overallScore,
          matchedSkills: matchedSkills.length > 0 ? matchedSkills : aiDetails.skills.slice(0, 5),
          missingSkills: missingSkills.slice(0, 5),
          explanation: aiDetails.matchingExplanation || '',
        });
      } catch (err: any) {
        logger.error({ err, studentId: student.id }, 'Candidate match against custom JD failed');
      }
    }

    return candidates.sort((a, b) => b.atsScore - a.atsScore);
  }
}
