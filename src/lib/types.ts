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

export interface PrepBrief {
  role: string;
  company: string;
  snapshot: string;
  fit_Score?: FitScore;
  questions: BriefQuestion[];
  suggested_answers: BriefAnswer[];
  red_flags: BriefRedFlag[];
  talking_points: string[];
}

export interface SavedBrief {
  id: string;
  createdAt: string;
  title: string;
  brief: PrepBrief;
  resumePreview: string;
  jdPreview: string;
}
