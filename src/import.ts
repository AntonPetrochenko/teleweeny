import { PlaybackEngine } from './playback';
import type { Program, Bumper, Logo, BumperAudio } from './types';

export class Importer {

  private playbackEngine: PlaybackEngine;


  constructor(playbackEngine: PlaybackEngine) {
    this.playbackEngine = playbackEngine;
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
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      programsList.removeChild(programItem);
      // Remove from playback engine (we'll need to add this method)
    });
    
    programItem.addEventListener('click', () => {
      // Force play this program
      this.playbackEngine.forcePlayProgram(program);
    });
    
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
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bumpersList.removeChild(bumperItem);
      // Remove from playback engine
    });
    
    bumperItem.addEventListener('click', () => {
      // Force play this bumper
      this.playbackEngine.forcePlayBumper(bumper);
    });
    
    bumpersList.appendChild(bumperItem);
  }

  private addBumperAudioToList(bumperAudio: BumperAudio) {
    const bumperAudiosList = document.querySelector('#bumper-audios-list .list-content') as HTMLDivElement;
    const bumperAudioItem = document.createElement('div');
    
    bumperAudioItem.innerHTML = `
      <span>${bumperAudio.id}: ${bumperAudio.audioFile.name}</span>
      <button class="delete-btn">×</button>
    `;
    bumperAudioItem.style.cssText = `
      cursor: pointer;
      padding: 5px;
      margin: 2px 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const deleteBtn = bumperAudioItem.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.style.cssText = `
      background: red;
      border: none;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
    `;
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bumperAudiosList.removeChild(bumperAudioItem);
    });
    
    bumperAudioItem.addEventListener('click', () => {
      this.playbackEngine.forcePlayBumperAudio(bumperAudio);
    });
    
    bumperAudiosList.appendChild(bumperAudioItem);
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
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      logosList.removeChild(logoItem);
      // Remove from playback engine
    });
    
    logoItem.addEventListener('click', () => {
      // Force play this logo
      this.playbackEngine.forcePlayLogo(logo);
    });
    
    logosList.appendChild(logoItem);
  }


  async importFiles(files: File[]) {
    const configFile = files.find(file => file.name.endsWith('.json'));
    if (!configFile) {
      alert('No config file found in import');
      return;
    }

    const configText = await configFile.text();
    const config = JSON.parse(configText);

    // Clear existing media
    this.clearExistingMedia();

    // Import programs
    for (const programConfig of config.programs) {
      const programFile = files.find(file => file.name === programConfig.filename);
      if (programFile) {
        const program: Program = {
          id: programConfig.id,
          videoFile: programFile
        };
        this.playbackEngine.addProgram(program);
        
        if (programConfig.position) {
          this.playbackEngine.setProgramPosition(program.id, programConfig.position);
        }
        this.addProgramToList(program);
      }
    }

    // Import bumpers
    for (const bumperConfig of config.bumpers) {
      const videoFile = files.find(file => file.name === bumperConfig.videoFilename);
      if (videoFile) {
        const bumper: Bumper = {
          id: bumperConfig.id,
          videoFile: videoFile
        };
        this.playbackEngine.addBumper(bumper);
        this.addBumperToList(bumper);
      }
    }

    // Import bumper audios
    for (const bumperAudioConfig of config.bumperAudios) {
      const audioFile = files.find(file => file.name === bumperAudioConfig.audioFilename);
      if (audioFile) {
        const bumperAudio: BumperAudio = {
          id: bumperAudioConfig.id,
          audioFile: audioFile
        };
        this.playbackEngine.addBumperAudio(bumperAudio);
        this.addBumperAudioToList(bumperAudio);
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

    // Import positions
    if (config.positions) {
      Object.entries(config.positions).forEach(([programId, position]: [string, any]) => {
        this.playbackEngine.setProgramPosition(programId, position);
      });
    }

    // Import auto-restart setting
    if (config.autoRestart !== undefined) {
      this.playbackEngine.setAutoRestart(config.autoRestart);
      const autoRestartCheckbox = document.getElementById('auto-restart-checkbox') as HTMLInputElement;
      if (autoRestartCheckbox) {
        autoRestartCheckbox.checked = config.autoRestart;
      }
    }

    alert(`Import completed successfully! Loaded ${config.programs.length} programs, ${config.bumpers.length} bumpers, ${config.bumperAudios.length} bumper audios, and ${config.logos.length} logos.`);
  }

  private clearExistingMedia() {
    // Clear all lists
    const programsList = document.querySelector('#programs-list .list-content') as HTMLDivElement;
    const bumpersList = document.querySelector('#bumpers-list .list-content') as HTMLDivElement;
    const bumperAudiosList = document.querySelector('#bumper-audios-list .list-content') as HTMLDivElement;
    const logosList = document.querySelector('#logos-list .list-content') as HTMLDivElement;
    
    programsList.innerHTML = '';
    bumpersList.innerHTML = '';
    bumperAudiosList.innerHTML = '';
    logosList.innerHTML = '';

    // Clear playback engine
    this.playbackEngine.clearAll();
  }
}