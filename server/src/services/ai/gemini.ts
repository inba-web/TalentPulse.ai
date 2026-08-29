import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Zod schema for Job Description AI output
export const jdAiSchema = z.object({
  jobTitle: z.string().default('Software Engineer'),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  education: z.string().default('Bachelor\'s Degree'),
  experience: z.string().default('0-2 years'),
  responsibilities: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  location: z.string().default('Remote'),
  ctc: z.number().default(0),
});

// Zod schema for Resume extraction AI output
export const resumeAiSchema = z.object({
  fullName: z.string().default('Candidate'),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().default(0),
  educationDegrees: z.array(z.string()).default([]),
  projectContexts: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  semanticEvidence: z.array(z.string()).default([]),
  matchingExplanation: z.string().default('No explanation provided'),
});

export class GeminiProvider {
  /**
   * Extract structured job specifications from raw JD text.
   */
  public static async extractJobDetails(jdText: string): Promise<z.infer<typeof jdAiSchema>> {
    if (!genAI) {
      logger.warn('GEMINI_API_KEY not configured. Using rule-based offline parsing.');
      return this.fallbackJdParser(jdText);
    }

    try {
      // Use Gemini 1.5 Flash for speed and accuracy
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
        Analyze the following Job Description (JD) text and extract the structured values in JSON format:
        {
          "jobTitle": "title of job",
          "requiredSkills": ["skill1", "skill2"],
          "preferredSkills": ["skill1", "skill2"],
          "education": "minimum education required",
          "experience": "years of experience requested",
          "responsibilities": ["duty1", "duty2"],
          "technologies": ["tech1", "tech2"],
          "keywords": ["keyword1", "keyword2"],
          "location": "location of job",
          "ctc": numeric_value_in_lpa (defaults to 0 if not mentioned)
        }
        
        Job Description Text:
        ${jdText}
      `;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsed = JSON.parse(text);

      return jdAiSchema.parse(parsed);
    } catch (error) {
      logger.error({ error, jdText }, 'Gemini Job Description extraction failed. Falling back to offline parser.');
      return this.fallbackJdParser(jdText);
    }
  }

  /**
   * Extract skills, education, and projects from resume text for matching.
   */
  public static async extractResumeDetails(resumeText: string, jdTextForContext?: string): Promise<z.infer<typeof resumeAiSchema>> {
    if (!genAI) {
      logger.warn('GEMINI_API_KEY not configured. Using rule-based offline resume parsing.');
      return this.fallbackResumeParser(resumeText, jdTextForContext);
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
        Analyze the following resume and extract the key information in JSON format:
        {
          "fullName": "Full name of candidate",
          "skills": ["javascript", "aws", "docker"],
          "experienceYears": numeric_years_of_experience (e.g. 2),
          "educationDegrees": ["B.Tech Computer Science"],
          "projectContexts": ["built a web app", "deployed cloud servers"],
          "keywords": ["react", "node", "mysql"],
          "semanticEvidence": ["evidence of using AWS for scaling", "used Docker in projects"],
          "matchingExplanation": "Brief summary of how this candidate fits the role"
        }
        
        ${jdTextForContext ? `Use this Job Description context for matching guidelines:\n${jdTextForContext}` : ''}
        
        Resume text:
        ${resumeText}
      `;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsed = JSON.parse(text);

      return resumeAiSchema.parse(parsed);
    } catch (error) {
      logger.error({ error, resumeText }, 'Gemini Resume extraction failed. Falling back to offline parser.');
      return this.fallbackResumeParser(resumeText, jdTextForContext);
    }
  }

  /**
   * Rule-based JD parser for offline fallbacks.
   */
  private static fallbackJdParser(text: string): z.infer<typeof jdAiSchema> {
    const lower = text.toLowerCase();
    const skillsList = ['react', 'node', 'javascript', 'typescript', 'python', 'sql', 'aws', 'docker', 'kubernetes', 'java', 'c++', 'git'];
    const matchedSkills = skillsList.filter((s) => lower.includes(s));

    // Try to guess CTC
    let ctc = 0;
    const ctcMatch = text.match(/(\d+(\.\d+)?)\s*(lpa|lakhs|lakh|l)/i);
    if (ctcMatch) {
      ctc = parseFloat(ctcMatch[1]);
    }

    // Try to guess experience
    let experience = '0-2 years';
    const expMatch = text.match(/(\d+)\s*-\s*(\d+)\s*(years|yr|yrs)/i) || text.match(/(\d+)\+\s*years/i);
    if (expMatch) {
      experience = expMatch[0];
    }

    return {
      jobTitle: text.split('\n')[0].substring(0, 50) || 'Software Developer',
      requiredSkills: matchedSkills,
      preferredSkills: matchedSkills.slice(0, 2),
      education: lower.includes('b.tech') || lower.includes('b.e') ? 'B.Tech/B.E' : 'Bachelor\'s Degree',
      experience,
      responsibilities: ['Understand product requirements', 'Write clean and tested code', 'Collaborate with teams'],
      technologies: matchedSkills,
      keywords: matchedSkills,
      location: lower.includes('remote') ? 'Remote' : 'Bangalore',
      ctc: ctc || 6.5,
    };
  }

  /**
   * Rule-based Resume parser for offline fallbacks.
   */
  private static fallbackResumeParser(text: string, jdText?: string): z.infer<typeof resumeAiSchema> {
    const lower = text.toLowerCase();
    const skillsList = ['react', 'node', 'javascript', 'typescript', 'python', 'sql', 'aws', 'docker', 'kubernetes', 'java', 'c++', 'git', 'terraform', 'linux'];
    const matchedSkills = skillsList.filter((s) => lower.includes(s));

    // Guess name
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const fullName = lines[0] || 'Candidate';

    // Guess education
    const educationDegrees: string[] = [];
    if (lower.includes('b.tech') || lower.includes('bachelor')) educationDegrees.push('B.Tech Computer Science');
    if (lower.includes('hsc') || lower.includes('school')) educationDegrees.push('HSC Secondary School');

    // Semantic evidence
    const semanticEvidence: string[] = [];
    if (lower.includes('aws')) semanticEvidence.push('Project mentions deploying cloud resources on AWS');
    if (lower.includes('docker')) semanticEvidence.push('Mentions containerizing local application structures using Docker');
    if (lower.includes('react')) semanticEvidence.push('Experienced building web user interfaces with React');

    return {
      fullName,
      skills: matchedSkills,
      experienceYears: lower.includes('senior') ? 5 : 1,
      educationDegrees,
      projectContexts: ['Developed localized web features', 'Optimized database search indices'],
      keywords: matchedSkills,
      semanticEvidence,
      matchingExplanation: 'Matched using rule-based local parser based on keyword densities.',
    };
  }
}
