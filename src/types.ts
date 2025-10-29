export interface Program {
  id: string;
  videoFile: File;
  duration?: number;
}

export interface Bumper {
  id: string;
  videoFile: File;
  audioFile?: File;
  loopDuration?: number;
}

export interface Logo {
  id: string;
  imageFile: File;
  displayDuration?: number;
}

export interface PlaybackState {
  currentProgram?: Program;
  currentBumper?: Bumper;
  currentLogo?: Logo;
  isPlaying: boolean;
  isDashboardVisible: boolean;
}