export interface GeneratedWallpaper {
  originalUrl: string;
  generatedUrl: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface StyleOption {
  id: string;
  label: string;
  prompt: string;
}
