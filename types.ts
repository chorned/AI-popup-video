export interface FactItem {
  text: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

export interface GeminiResponse {
  isValidMusicVideo: boolean;
  isMusicVideoUnsure?: boolean; // Warns user if AI is uncertain
  videoTitle?: string; // Captured title from AI identification
  reason?: string;
  facts?: FactItem[]; 
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR',
}

export interface VideoMetadata {
  id: string;
  title?: string;
}