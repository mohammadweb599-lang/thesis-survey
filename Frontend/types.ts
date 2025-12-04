export enum QuestionType {
  TEXT = 'TEXT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  HEATMAP = 'HEATMAP',
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[]; // For Multiple Choice
  imageUrl?: string; // For Heatmap
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
  isPublished: boolean;
}

export interface HeatmapPoint {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface ResponseAnswer {
  questionId: string;
  textAnswer?: string;
  choiceIndex?: number;
  heatmapPoints?: HeatmapPoint[]; // Changed to array for multiple points
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: ResponseAnswer[];
  submittedAt: number;
}