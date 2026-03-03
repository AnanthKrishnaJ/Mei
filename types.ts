
export enum ToxicityLevel {
  SAFE = 'SAFE',
  TRASH_TALK = 'TRASH_TALK',
  SARCASM = 'SARCASM',
  MILD = 'MILD',
  TOXIC = 'TOXIC',
  HIGHLY_TOXIC = 'HIGHLY_TOXIC',
  EXTREME = 'EXTREME'
}

export interface Highlight {
  word: string;
  category: string;
}

export interface ToxicityResult {
  score: number;
  level: ToxicityLevel;
  detectedLanguage: string;
  englishTranslation?: string;
  categories: string[];
  highlights: Highlight[];
  timestamp: number;
  originalText: string;
}

export interface HistoryItem extends ToxicityResult {
  id: string;
}
