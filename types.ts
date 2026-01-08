export interface PixelData {
  r: number;
  g: number;
  b: number;
  colorIndex: number; // 0 to N-1
  isColored: boolean;
}

export interface GameState {
  id?: string; // Unique ID for saving/loading
  stage: 'input' | 'preview' | 'processing' | 'playing' | 'complete';
  prompt: string;
  style: string; // 'cute', 'realistic', 'abstract', etc.
  difficulty: 'easy' | 'medium' | 'hard'; // Controls brush size
  originalImage: string | null;
  gridSize: number; // e.g., 32 for 32x32
  colorCount: number; // 5 to 100
  grid: PixelData[];
  palette: string[]; // Hex codes
  activeColorIndex: number; // The color currently being painted (0-based)
  unlockedColorIndex: number; // The highest color index currently unlocked
  completedPixels: number;
  totalPixels: number;
  generationStats?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    model?: string;
  };
}

export interface ProcessingOptions {
  colorCount: number;
  gridSize: number;
}