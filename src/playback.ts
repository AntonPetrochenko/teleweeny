import type { Program, Bumper, Logo, BumperAudio } from './types';

export class PlaybackEngine {
  private programs: Program[] = [];
  private bumpers: Bumper[] = [];
  private logos: Logo[] = [];
  private currentProgramsDeck: Program[] = [];
  private currentBumpersDeck: Bumper[] = [];
  private currentLogosDeck: Logo[] = [];
  private isPlaying = false;
  private videoElement: HTMLVideoElement;
  private currentCyclePromise: Promise<void> | null = null;
  private currentBumperAudiosDeck: BumperAudio[] = [];
  private audioElement: HTMLAudioElement;
  private currentProgram: Program | undefined;
  private autoRestart = false;
  private bumperAudios: BumperAudio[] = [];

  private scale = 1;
  private positions = new Map<string, { x: number; y: number; scale: number }>();

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.audioElement = new Audio();
    
    this.videoElement.style.objectFit = 'contain';
    this.setupScale();
    
    // Add error event listeners
    this.videoElement.addEventListener('error', this.handleVideoError.bind(this));
    this.audioElement.addEventListener('error', this.handleAudioError.bind(this));
  }

  private handleVideoError() {
    console.error('Video element error:', this.videoElement.error);
    this.skipCurrentMedia();
  }

  private handleAudioError() {
    console.error('Audio element error:', this.audioElement.error);
    this.skipCurrentMedia();
  }

  private skipCurrentMedia() {
    // If we're playing and an error occurs, skip to the next item
    if (this.isPlaying) {
      this.videoElement.pause();
      this.audioElement.pause();
      // The current promise will reject and the cycle will continue with next item
    }
  }

  setProgramPosition(programId: string, position: { x: number; y: number; scale: number }) {
    this.positions.set(programId, position);
  }

  setAutoRestart(autoRestart: boolean) {
    this.autoRestart = autoRestart;
  }

  getAutoRestart(): boolean {
    return this.autoRestart;
  }

  stopPlayback() {
    this.isPlaying = false;
    this.videoElement.pause();
    this.audioElement.pause();
    this.videoElement.src = '';
    this.audioElement.src = '';
  }

  private hideUI() {
    const dashboard = document.getElementById('dashboard');
    const programsList = document.getElementById('programs-list');
    const bumpersList = document.getElementById('bumpers-list');
    const logosList = document.getElementById('logos-list');
    
    if (dashboard) dashboard.style.display = 'none';
    if (programsList) programsList.style.display = 'none';
    if (bumpersList) bumpersList.style.display = 'none';
    if (logosList) logosList.style.display = 'none';
  }

  private removeDoneScreen() {
    const doneImg = document.querySelector('img[src="done.png"]');
    if (doneImg) {
      document.body.removeChild(doneImg);
    }
  }

  private async playNextCycle() {
    if (!this.isPlaying) return;

    this.currentCyclePromise = this.executeCycle();
    await this.currentCyclePromise;
    
    if (this.isPlaying && (this.currentProgramsDeck.length > 0 || this.autoRestart)) {
      if (this.currentProgramsDeck.length === 0 && this.autoRestart) {
        this.currentProgramsDeck = [...this.programs];
      }
      this.playNextCycle();
    }
  }

  private showDoneScreen() {
    this.videoElement.style.display = 'none';
    
    const doneImg = document.createElement('img');
    doneImg.src = 'done.png';
    doneImg.style.position = 'fixed';
    doneImg.style.top = '50%';
    doneImg.style.left = '50%';
    doneImg.style.transform = 'translate(-50%, -50%)';
    doneImg.style.maxWidth = '90%';
    doneImg.style.maxHeight = '90%';
    doneImg.style.zIndex = '100';
    
    document.body.appendChild(doneImg);
  }

  private async playProgram(program: Program): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentProgram = program;
      
      const savedPosition = this.positions.get(program.id);
      if (savedPosition) {
        this.scale = savedPosition.scale;
        this.videoElement.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
      } else {
        this.scale = 1;
        this.videoElement.style.transform = 'translate(-50%, -50%) scale(1)';
        this.positions.set(program.id, { x: 0, y: 0, scale: 1 });
      }
      
      this.videoElement.style.left = '50%';
      this.videoElement.style.top = '50%';
      this.videoElement.style.display = 'block';
      this.videoElement.style.opacity = '1';
      
      // Add error handling for program loading
      const handleProgramError = () => {
        this.videoElement.removeEventListener('error', handleProgramError);
        this.videoElement.removeEventListener('ended', handleProgramEnd);
        console.error(`Failed to load program: ${program.id}`);
        reject(new Error(`Program load failed: ${program.id}`));
      };
      
      const handleProgramEnd = () => {
        this.videoElement.removeEventListener('error', handleProgramError);
        this.videoElement.removeEventListener('ended', handleProgramEnd);
        this.videoElement.style.transition = 'opacity 1s ease-out';
        this.videoElement.style.opacity = '0';
        
        setTimeout(() => {
          this.videoElement.style.transition = '';
          this.currentProgram = undefined;
          resolve();
        }, 1000);
      };
      
      this.videoElement.addEventListener('error', handleProgramError);
      this.videoElement.addEventListener('ended', handleProgramEnd);
      
      try {
        this.videoElement.src = URL.createObjectURL(program.videoFile);
        this.videoElement.play().catch(error => {
          console.error('Program play failed:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Program setup failed:', error);
        reject(error);
      }
    });
  }

  private async showLogo(logo: Logo): Promise<void> {
    return new Promise((resolve, reject) => {
      this.videoElement.style.display = 'none';
      
      const logoImg = document.createElement('img');
      logoImg.src = URL.createObjectURL(logo.imageFile);
      logoImg.style.position = 'fixed';
      logoImg.style.top = '50%';
      logoImg.style.left = '50%';
      logoImg.style.transform = 'translate(-50%, -50%)';
      logoImg.style.maxWidth = '90%';
      logoImg.style.maxHeight = '90%';
      logoImg.style.zIndex = '100';
      logoImg.style.opacity = '0';
      logoImg.style.transition = 'opacity 1s ease-in';
      
      document.body.appendChild(logoImg);
      
      // Add error handling for logo loading
      const handleLogoError = () => {
        logoImg.removeEventListener('error', handleLogoError);
        console.error(`Failed to load logo: ${logo.id}`);
        document.body.removeChild(logoImg);
        URL.revokeObjectURL(logoImg.src);
        reject(new Error(`Logo load failed: ${logo.id}`));
      };
      
      logoImg.addEventListener('error', handleLogoError);
      
      // Fade in
      setTimeout(() => {
        logoImg.style.opacity = '1';
      }, 50);
      
      setTimeout(() => {
        // Fade out
        logoImg.style.transition = 'opacity 1s ease-out';
        logoImg.style.opacity = '0';
        
        setTimeout(() => {
          document.body.removeChild(logoImg);
          URL.revokeObjectURL(logoImg.src);
          resolve();
        }, 1000);
      }, 4000);
    });
  }

  private drawFromDeck<T>(deck: T[], onEmpty?: () => T | undefined): T | undefined {
    if (deck.length === 0) {
      return onEmpty ? onEmpty() : undefined;
    }
    const randomIndex = Math.floor(Math.random() * deck.length);
    const item = deck[randomIndex];
    deck.splice(randomIndex, 1);
    return item;
  }

  private async executeCycle(): Promise<void> {
    try {
      const program = this.drawFromDeck(this.currentProgramsDeck, () => {
        if (this.autoRestart) {
          this.currentProgramsDeck = [...this.programs];
          return this.drawFromDeck(this.currentProgramsDeck);
        } else {
          this.stopPlayback();
          this.showDoneScreen();
          return undefined;
        }
      });
      
      const bumper = this.drawFromDeck(this.currentBumpersDeck, () => {
        this.currentBumpersDeck = [...this.bumpers];
        return this.drawFromDeck(this.currentBumpersDeck);
      });
      
      const bumperAudio = this.drawFromDeck(this.currentBumperAudiosDeck, () => {
        this.currentBumperAudiosDeck = [...this.bumperAudios];
        return this.drawFromDeck(this.currentBumperAudiosDeck);
      });
      
      const logo = this.drawFromDeck(this.currentLogosDeck, () => {
        this.currentLogosDeck = [...this.logos];
        return this.drawFromDeck(this.currentLogosDeck);
      });

      if (!program) {
        return;
      }

      // Try to play program with error recovery
      try {
        if (program) {
          await this.playProgram(program);
        }
      } catch (error) {
        console.error('Program playback failed, continuing cycle:', error);
        // Continue with the cycle even if program fails
      }

      // Try to play bumper with error recovery
      try {
        if (bumper && bumperAudio) {
          await this.playBumper(bumper, bumperAudio);
        }
      } catch (error) {
        console.error('Bumper playback failed, continuing cycle:', error);
        // Continue with the cycle even if bumper fails
      }

      // Try to show logo with error recovery
      try {
        if (logo) {
          await this.showLogo(logo);
        }
      } catch (error) {
        console.error('Logo display failed, continuing cycle:', error);
        // Continue with the cycle even if logo fails
      }
    } catch (error) {
      console.error('Cycle execution failed:', error);
      // Don't rethrow - let the cycle continue
    }
  }

  private async playBumper(bumper: Bumper, bumperAudio: BumperAudio): Promise<void> {
    return new Promise((resolve, reject) => {
      this.videoElement.style.transform = 'translate(-50%, -50%) scale(1)';
      this.videoElement.style.display = 'block';
      this.videoElement.style.opacity = '0';
      this.videoElement.loop = true;
      
      // Add error handling for bumper video
      const handleBumperError = () => {
        cleanup();
        reject(new Error(`Bumper video load failed: ${bumper.id}`));
      };
      
      const handleBumperAudioError = () => {
        cleanup();
        reject(new Error(`Bumper audio load failed: ${bumperAudio.id}`));
      };
      
      const cleanup = () => {
        this.videoElement.removeEventListener('error', handleBumperError);
        this.audioElement.removeEventListener('error', handleBumperAudioError);
        this.videoElement.pause();
        this.audioElement.pause();
        this.videoElement.src = '';
        this.audioElement.src = '';
      };
      
      this.videoElement.addEventListener('error', handleBumperError);
      this.audioElement.addEventListener('error', handleBumperAudioError);
      
      // Fade in bumper
      setTimeout(() => {
        this.videoElement.style.transition = 'opacity 1s ease-in';
        this.videoElement.style.opacity = '1';
      }, 50);
      
      try {
        this.videoElement.src = URL.createObjectURL(bumper.videoFile);
        this.audioElement.src = URL.createObjectURL(bumperAudio.audioFile);
        this.audioElement.loop = true;
        
        Promise.all([
          this.videoElement.play(),
          this.audioElement.play()
        ]).catch(error => {
          console.error('Bumper play failed:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Bumper setup failed:', error);
        reject(error);
      }
      
      // Play for exactly 10 seconds then fade out
      setTimeout(() => {
        cleanup();
        this.videoElement.loop = false;
        this.audioElement.loop = false;
        
        this.videoElement.style.transition = 'opacity 1s ease-out';
        this.videoElement.style.opacity = '0';
        this.audioElement.style.transition = 'opacity 1s ease-out';
        this.audioElement.volume = 0;
        
        setTimeout(() => {
          this.videoElement.pause();
          this.audioElement.pause();
          this.videoElement.style.transition = '';
          this.audioElement.volume = 1;
          this.audioElement.style.transition = '';
          this.audioElement.src = '';
          resolve();
        }, 1000);
      }, 10000);
    });
  }

  // Force play methods with error handling
  async forcePlayProgram(program: Program) {
    this.isPlaying = false;
    this.videoElement.pause();
    this.audioElement.pause();
    
    if (this.currentCyclePromise) {
      await this.currentCyclePromise;
    }
    
    this.currentProgramsDeck = [program];
    this.currentBumpersDeck = [...this.bumpers];
    this.currentLogosDeck = [...this.logos];
    
    try {
      await this.playProgram(program);
    } catch (error) {
      console.error('Force play program failed:', error);
      // Don't throw - let the caller handle it
    }
  }

  async forcePlayLogo(logo: Logo) {
    this.isPlaying = false;
    this.videoElement.pause();
    this.audioElement.pause();
    
    if (this.currentCyclePromise) {
      await this.currentCyclePromise;
    }
    
    try {
      await this.showLogo(logo);
    } catch (error) {
      console.error('Force play logo failed:', error);
      // Don't throw - let the caller handle it
    }
  }

  async forcePlayBumper(bumper: Bumper) {
    if (this.bumperAudios.length === 0) {
      alert('No bumper audio available');
      return;
    }
    
    const randomAudioIndex = Math.floor(Math.random() * this.bumperAudios.length);
    const bumperAudio = this.bumperAudios[randomAudioIndex];
    
    this.isPlaying = false;
    this.videoElement.pause();
    this.audioElement.pause();
    
    if (this.currentCyclePromise) {
      await this.currentCyclePromise;
    }
    
    try {
      await this.playBumper(bumper, bumperAudio);
    } catch (error) {
      console.error('Force play bumper failed:', error);
      // Don't throw - let the caller handle it
    }
  }

  async forcePlayBumperAudio(bumperAudio: BumperAudio) {
    if (this.bumpers.length === 0) {
      alert('No bumper video available');
      return;
    }
    
    const randomBumperIndex = Math.floor(Math.random() * this.bumpers.length);
    const bumper = this.bumpers[randomBumperIndex];
    
    this.isPlaying = false;
    this.videoElement.pause();
    this.audioElement.pause();
    
    if (this.currentCyclePromise) {
      await this.currentCyclePromise;
    }
    
    try {
      await this.playBumper(bumper, bumperAudio);
    } catch (error) {
      console.error('Force play bumper audio failed:', error);
      // Don't throw - let the caller handle it
    }
  }

  // Rest of the methods remain the same...
  private setupScale() {
    this.videoElement.style.position = 'fixed';
    this.videoElement.style.top = '50%';
    this.videoElement.style.left = '50%';
    this.videoElement.style.transform = 'translate(-50%, -50%)';
    this.videoElement.style.cursor = 'default';
    this.videoElement.style.transformOrigin = 'center center';

    this.videoElement.addEventListener('wheel', this.handleWheel.bind(this));
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.1, Math.min(3, this.scale + delta));
    
    this.scale = newScale;
    this.videoElement.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
    this.saveCurrentPosition();
  }

  private saveCurrentPosition() {
    const currentProgram = this.getCurrentProgram();
    if (currentProgram) {
      this.positions.set(currentProgram.id, {
        x: 0,
        y: 0,
        scale: this.scale
      });
    }
  }

  getExportData() {
    return {
      programs: this.programs,
      bumpers: this.bumpers,
      logos: this.logos,
      positions: Object.fromEntries(this.positions),
      autoRestart: this.autoRestart
    };
  }

  private getCurrentProgram(): Program | undefined {
    return this.currentProgram;
  }

  getPositions(): Map<string, { x: number; y: number; scale: number }> {
    return this.positions;
  }

  togglePause() {
    if (this.videoElement.paused && this.videoElement.src) {
      this.videoElement.play().catch(console.error);
    } else if (!this.videoElement.paused) {
      this.videoElement.pause();
    }
    
    if (!this.audioElement.paused && this.audioElement.src) {
      this.audioElement.pause();
    } else if (this.audioElement.paused && this.audioElement.src) {
      this.audioElement.play().catch(console.error);
    }
  }

  skipToNextProgram() {
    if (!this.isPlaying) return;
    
    if (this.currentCyclePromise) {
      this.videoElement.currentTime = this.videoElement.duration;
    }
  }

  jumpForward(seconds: number) {
    if (!this.videoElement.src || this.videoElement.paused) return;
    
    const newTime = this.videoElement.currentTime + seconds;
    this.videoElement.currentTime = Math.min(newTime, this.videoElement.duration);
    
    if (this.videoElement.currentTime >= this.videoElement.duration) {
      this.skipToNextProgram();
    }
  }

  clearAll() {
    this.programs = [];
    this.bumpers = [];
    this.bumperAudios = [];
    this.logos = [];
    this.currentProgramsDeck = [];
    this.currentBumpersDeck = [];
    this.currentBumperAudiosDeck = [];
    this.currentLogosDeck = [];
    this.positions.clear();
    this.stopPlayback();
  }

  startPlayback() {
    if (this.isPlaying) return;
    
    if (this.bumpers.length === 0 || this.bumperAudios.length === 0 || this.logos.length === 0) {
      alert('Cannot start playback: Need at least one bumper, one bumper audio, and one logo');
      return;
    }
    
    this.removeDoneScreen();
    this.hideUI();
    
    this.currentProgramsDeck = [...this.programs];
    this.currentBumpersDeck = [...this.bumpers];
    this.currentBumperAudiosDeck = [...this.bumperAudios];
    this.currentLogosDeck = [...this.logos];
    
    this.isPlaying = true;
    this.playNextCycle();
  }

  addProgram(program: Program) {
    this.programs.push(program);
    if (!this.positions.has(program.id)) {
      this.positions.set(program.id, { x: 0, y: 0, scale: 1 });
    }
  }

  addBumper(bumper: Bumper) {
    this.bumpers.push(bumper);
  }

  addBumperAudio(bumperAudio: BumperAudio) {
    this.bumperAudios.push(bumperAudio);
  }

  addLogo(logo: Logo) {
    this.logos.push(logo);
  }

  getPrograms(): Program[] {
    return this.programs;
  }

  getBumpers(): Bumper[] {
    return this.bumpers;
  }

  getBumperAudios(): BumperAudio[] {
    return this.bumperAudios;
  }

  getLogos(): Logo[] {
    return this.logos;
  }
}