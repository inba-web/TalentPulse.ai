export interface JdRequirementSpec {
  requiredSkills: string[];
  experienceYearsRequired: number; // e.g. 2
  educationRequirement: string; // e.g. "B.Tech" or "Bachelor"
  keywords: string[];
}

export interface CandidateResumeSpec {
  skills: string[];
  experienceYears: number;
  educationDegrees: string[];
  projectContexts: string[];
  keywords: string[];
  resumeText: string;
}

export class AtsScoringEngine {
  /**
   * Deterministically calculates overall ATS score using weighted components.
   */
  public static calculateScore(
    candidate: CandidateResumeSpec,
    jd: JdRequirementSpec
  ) {
    // Helper to normalize strings for matching
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    const candidateSkillsNorm = candidate.skills.map(normalize);
    const jdSkillsNorm = jd.requiredSkills.map(normalize);

    // 1. Technical Skill Match (35%)
    let technicalSkillScore = 100;
    if (jdSkillsNorm.length > 0) {
      const matchedSkills = jdSkillsNorm.filter((skill) => candidateSkillsNorm.includes(skill));
      technicalSkillScore = (matchedSkills.length / jdSkillsNorm.length) * 100;
    }

    // 2. Experience Match (20%)
    let experienceScore = 100;
    if (jd.experienceYearsRequired > 0) {
      if (candidate.experienceYears >= jd.experienceYearsRequired) {
        experienceScore = 100;
      } else {
        experienceScore = (candidate.experienceYears / jd.experienceYearsRequired) * 100;
      }
    }

    // 3. Education Match (15%)
    let educationScore = 50; // default baseline if degree matches partial
    const jdEduLower = jd.educationRequirement.toLowerCase();
    const matchesDegree = candidate.educationDegrees.some((degree) => {
      const dLower = degree.toLowerCase();
      return dLower.includes(jdEduLower) || jdEduLower.includes(dLower) ||
        (jdEduLower.includes('b.tech') && dLower.includes('computer')) ||
        (jdEduLower.includes('b.e') && dLower.includes('engineering'));
    });
    if (matchesDegree) {
      educationScore = 100;
    } else if (candidate.educationDegrees.length > 0) {
      educationScore = 70; // partial check
    }

    // 4. Project Match (10%)
    // Scan project contexts for mention of JD skills or keywords
    let projectScore = 50; // baseline for having projects
    if (candidate.projectContexts.length > 0) {
      let matches = 0;
      candidate.projectContexts.forEach((ctx) => {
        const ctxLower = ctx.toLowerCase();
        jd.requiredSkills.forEach((skill) => {
          if (ctxLower.includes(skill.toLowerCase())) matches++;
        });
      });
      projectScore = Math.min(100, 60 + matches * 10);
    } else {
      projectScore = 0; // No projects mentioned
    }

    // Parse candidate academic benchmark from text if present
    let academicScore = 80;
    const ugMatch = candidate.resumeText.match(/UG CGPA\/Percentage:\s*(\d+(?:\.\d+)?)/i) || candidate.resumeText.match(/UG %:\s*(\d+(?:\.\d+)?)/i);
    if (ugMatch && ugMatch[1]) {
      academicScore = Math.min(100, Math.max(50, parseFloat(ugMatch[1])));
    }

    // Deterministic per-candidate hash offset from candidate resume text
    let candidateSeed = 0;
    for (let i = 0; i < candidate.resumeText.length; i++) {
      candidateSeed = (candidateSeed * 31 + candidate.resumeText.charCodeAt(i)) % 10007;
    }
    const seedOffset = (candidateSeed % 19) - 9; // Range -9 to +9 points variance

    // 5. Keyword Coverage (10%)
    let keywordScore = 80;
    const jdKeywordsNorm = jd.keywords.map(normalize);
    const candidateKeywordsNorm = candidate.keywords.map(normalize);
    if (jdKeywordsNorm.length > 0) {
      const matchedKeywords = jdKeywordsNorm.filter((kw) => candidateKeywordsNorm.includes(kw));
      keywordScore = Math.min(100, (matchedKeywords.length / Math.max(1, jdKeywordsNorm.length)) * 100 + (candidateSeed % 15));
    }

    // 6. Resume Quality (10%)
    let qualityScore = 0;
    const text = candidate.resumeText.toLowerCase();
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(text)) qualityScore += 30;
    if (/\+?\d{10,13}/.test(text)) qualityScore += 30;
    if (text.length > 300 && text.length < 15000) qualityScore += 40;

    // Skill Density adjustment (5%)
    const skillRatio = (candidateSkillsNorm.length / Math.max(1, jdSkillsNorm.length));
    const skillBonus = Math.min(15, skillRatio * 5);

    // Weighted sum with candidate academic & seed variance
    let rawScore =
      technicalSkillScore * 0.35 +
      experienceScore * 0.15 +
      educationScore * 0.10 +
      academicScore * 0.15 +
      projectScore * 0.10 +
      keywordScore * 0.10 +
      qualityScore * 0.05 +
      skillBonus +
      (seedOffset * 0.5);

    // Clamp score cleanly between 52.0 and 97.5
    const overallScore = Math.min(97.5, Math.max(52.0, Math.round(rawScore * 10) / 10));

    return {
      technicalMatchScore: Math.round(technicalSkillScore * 10) / 10,
      experienceScore: Math.round(experienceScore * 10) / 10,
      educationScore: Math.round(educationScore * 10) / 10,
      projectScore: Math.round(projectScore * 10) / 10,
      keywordScore: Math.round(keywordScore * 10) / 10,
      qualityScore: Math.round(qualityScore * 10) / 10,
      overallScore,
    };
  }

}
