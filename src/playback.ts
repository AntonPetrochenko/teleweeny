import type { Program, Bumper, Logo } from './types';

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
  private audioElement: HTMLAudioElement;
  private currentProgram: Program | undefined;

  private scale = 1;
  private positions = new Map<string, { x: number; y: number; scale: number }>();

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.audioElement = new Audio();
    
    // Set video to fit instead of cover
    this.videoElement.style.objectFit = 'contain';
    this.setupScale(); // Initialize scale only
  }

  clearAll() {
    this.programs = [];
    this.bumpers = [];
    this.logos = [];
    this.currentProgramsDeck = [];
    this.currentBumpersDeck = [];
    this.currentLogosDeck = [];
    this.positions.clear();
    this.stopPlayback();
  }

  setProgramPosition(programId: string, position: { x: number; y: number; scale: number }) {
    this.positions.set(programId, position);
  }

  startPlayback() {
    if (this.isPlaying) return;
    
    // Check if we have at least one bumper and one logo
    if (this.bumpers.length === 0 || this.logos.length === 0) {
      alert('Cannot start playback: Need at least one bumper and one logo');
      return;
    }
    
    // Remove done.png if present
    this.removeDoneScreen();
    
    // Hide UI elements
    this.hideUI();
    
    // Initialize decks
    this.currentProgramsDeck = [...this.programs];
    this.currentBumpersDeck = [...this.bumpers];
    this.currentLogosDeck = [...this.logos];
    
    this.isPlaying = true;
    this.playNextCycle();
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
    
    // Continue cycle if we still have programs
    if (this.isPlaying) {
      this.playNextCycle();
    }
  }

  private async executeCycle(): Promise<void> {
    // Draw from decks
    const program = this.drawFromDeck(this.currentProgramsDeck, () => {
      // Programs deck empty - show done screen
      this.stopPlayback();
      this.showDoneScreen();
      return undefined;
    });
    
    const bumper = this.drawFromDeck(this.currentBumpersDeck, () => {
      // Bumpers deck empty - reshuffle from original
      this.currentBumpersDeck = [...this.bumpers];
      return this.drawFromDeck(this.currentBumpersDeck);
    });
    
    const logo = this.drawFromDeck(this.currentLogosDeck, () => {
      // Logos deck empty - reshuffle from original
      this.currentLogosDeck = [...this.logos];
      return this.drawFromDeck(this.currentLogosDeck);
    });

    // If no program, we're done
    if (!program) {
      return;
    }

    if (program) {
      await this.playProgram(program);
    }
    
    if (bumper) {
      await this.playBumper(bumper);
    }
    
    if (logo) {
      await this.showLogo(logo);
    }
  }

  private showDoneScreen() {
    // Hide video element
    this.videoElement.style.display = 'none';
    
    // Create done screen image
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
    return new Promise((resolve) => {
      this.currentProgram = program;
      
      // Apply saved scale for this specific program
      const savedPosition = this.positions.get(program.id);
      if (savedPosition) {
        this.scale = savedPosition.scale;
        this.videoElement.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
      } else {
        // Reset to default scale for new programs
        this.scale = 1;
        this.videoElement.style.transform = 'translate(-50%, -50%) scale(1)';
        // Save default position for this program
        this.positions.set(program.id, { x: 0, y: 0, scale: 1 });
      }
      
      // Always center the video
      this.videoElement.style.left = '50%';
      this.videoElement.style.top = '50%';
      
      this.videoElement.style.display = 'block';
      this.videoElement.style.opacity = '1';
      this.videoElement.src = URL.createObjectURL(program.videoFile);
      
      this.videoElement.onended = () => {
        // Fade out program before resolving
        this.videoElement.style.transition = 'opacity 1s ease-out';
        this.videoElement.style.opacity = '0';
        
        setTimeout(() => {
          this.videoElement.style.transition = '';
          this.currentProgram = undefined;
          resolve();
        }, 1000);
      };
      
      this.videoElement.play().catch(console.error);
    });
  }

  private async playBumper(bumper: Bumper): Promise<void> {
    return new Promise((resolve) => {
      // Reset to default scale for bumpers
      this.videoElement.style.transform = 'translate(-50%, -50%) scale(1)';
      
      this.videoElement.style.display = 'block';
      this.videoElement.style.opacity = '0'; // Start faded in
      this.videoElement.src = URL.createObjectURL(bumper.videoFile);
      this.videoElement.loop = true;
      
      // Fade in bumper
      setTimeout(() => {
        this.videoElement.style.transition = 'opacity 1s ease-in';
        this.videoElement.style.opacity = '1';
      }, 50);
      
      // Play bumper audio if provided
      if (bumper.audioFile) {
        this.audioElement.src = URL.createObjectURL(bumper.audioFile);
        this.audioElement.loop = true;
        this.audioElement.play().catch(console.error);
      }
      
      // Play for exactly 10 seconds then fade out
      setTimeout(() => {
        this.videoElement.loop = false;
        this.audioElement.loop = false;
        
        // Add fade out effect
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
        }, 1000); // Wait for fade out to complete
        
      }, 10000); // 10 seconds total
      
      this.videoElement.play().catch(console.error);
    });
  }

  private async showLogo(logo: Logo): Promise<void> {
    return new Promise((resolve) => {
      // Hide video element during logo display
      this.videoElement.style.display = 'none';
      
      // Create temporary image element for logo display
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
      }, 4000); // Show for 4 seconds, then 1 second fade out
    });
  }

  private drawFromDeck<T>(deck: T[], onEmpty?: () => T | undefined): T | undefined {
    if (deck.length === 0) {
      return onEmpty ? onEmpty() : undefined;
    }
    const randomIndex = Math.floor(Math.random() * deck.length);
    const item = deck[randomIndex];
    deck.splice(randomIndex, 1); // Remove from deck
    return item;
  }

  // Force play methods
  async forcePlayProgram(program: Program) {
    this.isPlaying = false;
    this.videoElement.pause();
    this.audioElement.pause();
    
    if (this.currentCyclePromise) {
      await this.currentCyclePromise;
    }
    
    await this.playProgram(program);
  }

  async forcePlayBumper(bumper: Bumper) {
    this.isPlaying = false;
    this.videoElement.pause();
    this.audioElement.pause();
    
    if (this.currentCyclePromise) {
      await this.currentCyclePromise;
    }
    
    await this.playBumper(bumper);
  }

  // Methods to add media to decks
  addProgram(program: Program) {
    this.programs.push(program);
    // Initialize default position if not exists
    if (!this.positions.has(program.id)) {
      this.positions.set(program.id, { x: 0, y: 0, scale: 1 });
    }
  }

  addBumper(bumper: Bumper) {
    this.bumpers.push(bumper);
  }

  addLogo(logo: Logo) {
    this.logos.push(logo);
  }

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
    
    // Apply transform with center scaling
    this.videoElement.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
    
    // Save scale for current program
    this.saveCurrentPosition();
  }

  private saveCurrentPosition() {
    const currentProgram = this.getCurrentProgram();
    
    if (currentProgram) {
      this.positions.set(currentProgram.id, {
        x: 0, // No longer tracking position, just scale
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
      positions: Object.fromEntries(this.positions) // Convert Map to object for JSON
    };
  }

  private getCurrentProgram(): Program | undefined {
    return this.currentProgram;
  }

  getPrograms(): Program[] {
    return this.programs;
  }

  getBumpers(): Bumper[] {
    return this.bumpers;
  }

  getLogos(): Logo[] {
    return this.logos;
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
    
    // Also pause/resume bumper audio if playing
    if (!this.audioElement.paused && this.audioElement.src) {
      this.audioElement.pause();
    } else if (this.audioElement.paused && this.audioElement.src) {
      this.audioElement.play().catch(console.error);
    }
  }

  skipToNextProgram() {
    if (!this.isPlaying) return;
    
    // If we're in the middle of a cycle, skip to the next one
    if (this.currentCyclePromise) {
      // This will trigger the current program to end and move to the next cycle
      this.videoElement.currentTime = this.videoElement.duration;
    }
  }

  jumpForward(seconds: number) {
    if (!this.videoElement.src || this.videoElement.paused) return;
    
    const newTime = this.videoElement.currentTime + seconds;
    this.videoElement.currentTime = Math.min(newTime, this.videoElement.duration);
    
    // If we're at the end, skip to next program
    if (this.videoElement.currentTime >= this.videoElement.duration) {
      this.skipToNextProgram();
    }
  }
}