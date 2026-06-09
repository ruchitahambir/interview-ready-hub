export interface BriefQuestion {
  question: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export interface BriefAnswer {
  question: string;
  answer: string;
}

export interface BriefRedFlag {
  gap: string;
  how_to_address: string;
}

export interface FitScore {
  score: number;
  color: "green" | "amber" | "red";
  reasoning: string;
}

export interface MatchScore {
  score: number; // 0-100 weighted
  color: "green" | "amber" | "red";
  reasoning: string;
  dealbreakers_missed: string[];
}

export interface SkillWeight {
  skill: string;
  weight: number; // 1-5
  mustHave: boolean;
}

export interface PrepBrief {
  role: string;
  company: string;
  snapshot: string;
  fit_Score?: FitScore;
  match_score?: MatchScore;
  questions: BriefQuestion[];
  suggested_answers: BriefAnswer[];
  red_flags: BriefRedFlag[];
  talking_points: string[];
  targeted_screening_questions?: string[];
}

export interface SavedBrief {
  id: string;
  createdAt: string;
  title: string;
  brief: PrepBrief;
  resumePreview: string;
  jdPreview: string;
  candidateName?: string;
  batchId?: string;
}

export interface BatchCandidate {
  briefId: string;
  candidateName: string;
  fitScore: number;
  matchScore: number;
  color: "green" | "amber" | "red";
  error?: string;
}

export interface SavedBatch {
  id: string;
  createdAt: string;
  jobTitle: string;
  jdPreview: string;
  candidates: BatchCandidate[];
  skillWeights: SkillWeight[];
}
