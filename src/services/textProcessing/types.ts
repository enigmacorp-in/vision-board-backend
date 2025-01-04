export interface TextProcessingOptions {
  goals: string[];
  style?: string;
  additionalContext?: string;
}

export interface TextProcessingResult {
  prompt: string;
  visualElements: string[];
}

export interface TextProcessingService {
  processGoals(options: TextProcessingOptions): Promise<TextProcessingResult>;
} 