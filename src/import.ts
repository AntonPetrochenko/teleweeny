import { PlaybackEngine } from './playback';
import type { Program, Bumper, Logo } from './types';

export class Importer {
  private playbackEngine: PlaybackEngine;

  constructor(playbackEngine: PlaybackEngine) {
    this.playbackEngine = playbackEngine;
  }

  async importFiles(files: File[]) {
    // Find config file
    const configFile = files.find(file => file.name.endsWith('.json'));
    if (!configFile) {
      alert('No config file found in import');
      return;
    }

    // Parse config
    const configText = await configFile.text();
    const config = JSON.parse(configText);

    // Clear existing media
    this.clearExistingMedia();

    // Import programs with their positions
    for (const programConfig of config.programs) {
      const programFile = files.find(file => file.name === programConfig.filename);
      if (programFile) {
        const program: Program = {
          id: programConfig.id,
          videoFile: programFile
        };
        this.playbackEngine.addProgram(program);
        
        // Set program position if it exists in config
        if (programConfig.position) {
          this.playbackEngine.setProgramPosition(program.id, programConfig.position);
        }
        this.addProgramToList(program);
      }
    }

    // Import bumpers
    for (const bumperConfig of config.bumpers) {
      const videoFile = files.find(file => file.name === bumperConfig.videoFilename);
      let audioFile: File | undefined;
      
      if (bumperConfig.audioFilename) {
        audioFile = files.find(file => file.name === bumperConfig.audioFilename);
      }

      if (videoFile) {
        const bumper: Bumper = {
          id: bumperConfig.id,
          videoFile: videoFile,
          audioFile: audioFile
        };
        this.playbackEngine.addBumper(bumper);
        this.addBumperToList(bumper);
      }
    }

    // Import logos
    for (const logoConfig of config.logos) {
      const logoFile = files.find(file => file.name === logoConfig.filename);
      if (logoFile) {
        const logo: Logo = {
          id: logoConfig.id,
          imageFile: logoFile
        };
        this.playbackEngine.addLogo(logo);
        this.addLogoToList(logo);
      }
    }

    // Import positions if they exist in the config
    if (config.positions) {
      Object.entries(config.positions).forEach(([programId, position]: [string, any]) => {
        this.playbackEngine.setProgramPosition(programId, position);
      });
    }

    alert(`Import completed successfully! Loaded ${config.programs.length} programs, ${config.bumpers.length} bumpers, and ${config.logos.length} logos.`);
  }

  private clearExistingMedia() {
    // Clear lists
    const programsList = document.querySelector('#programs-list .list-content') as HTMLDivElement;
    const bumpersList = document.querySelector('#bumpers-list .list-content') as HTMLDivElement;
    const logosList = document.querySelector('#logos-list .list-content') as HTMLDivElement;
    
    programsList.innerHTML = '';
    bumpersList.innerHTML = '';
    logosList.innerHTML = '';

    // Clear playback engine
    this.playbackEngine.clearAll();
  }

  private addProgramToList(program: Program) {
    const programsList = document.querySelector('#programs-list .list-content') as HTMLDivElement;
    const programItem = document.createElement('div');
    
    programItem.innerHTML = `
      <span>${program.id}: ${program.videoFile.name}</span>
      <button class="delete-btn">×</button>
    `;
    programItem.style.cssText = `
      cursor: pointer;
      padding: 5px;
      margin: 2px 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const deleteBtn = programItem.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.style.cssText = `
      background: red;
      border: none;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
    `;
    
    programsList.appendChild(programItem);
  }

  private addBumperToList(bumper: Bumper) {
    const bumpersList = document.querySelector('#bumpers-list .list-content') as HTMLDivElement;
    const bumperItem = document.createElement('div');
    
    const audioText = bumper.audioFile ? ` + Audio` : '';
    bumperItem.innerHTML = `
      <span>${bumper.id}: ${bumper.videoFile.name}${audioText}</span>
      <button class="delete-btn">×</button>
    `;
    bumperItem.style.cssText = `
      cursor: pointer;
      padding: 5px;
      margin: 2px 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const deleteBtn = bumperItem.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.style.cssText = `
      background: red;
      border: none;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
    `;
    
    bumpersList.appendChild(bumperItem);
  }

  private addLogoToList(logo: Logo) {
    const logosList = document.querySelector('#logos-list .list-content') as HTMLDivElement;
    const logoItem = document.createElement('div');
    
    logoItem.innerHTML = `
      <span>${logo.id}: ${logo.imageFile.name}</span>
      <button class="delete-btn">×</button>
    `;
    logoItem.style.cssText = `
      cursor: pointer;
      padding: 5px;
      margin: 2px 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const deleteBtn = logoItem.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.style.cssText = `
      background: red;
      border: none;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
    `;
    
    logosList.appendChild(logoItem);
  }
}