import { PlaybackEngine } from './playback';
import type { Program, Bumper, Logo, BumperAudio } from './types';
import { Exporter } from './export';
import { Importer } from './import';

let playbackEngine: PlaybackEngine;
let exporter: Exporter;
let importer: Importer;

export function setPlaybackEngine(engine: PlaybackEngine) {
  playbackEngine = engine;
  exporter = new Exporter([], [], [], [], new Map(), false); // Will be updated when media is added
  importer = new Importer(engine);
}

function createListWindow(id: string, title: string, style: string): HTMLDivElement {
  const window = document.createElement('div');
  window.id = id;
  window.style.cssText = `
    position: fixed;
    ${style}
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 10px;
    z-index: 999;
    display: none;
    width: 200px;
    max-height: 300px;
    overflow-y: auto;
  `;
  window.innerHTML = `<h4>${title}</h4><div class="list-content"></div>`;
  return window;
}

function addProgram(playbackEngine: PlaybackEngine) {
  const input = document.getElementById('program-input') as HTMLInputElement;
  if (input.files && input.files[0]) {
    const programsList = document.querySelector('#programs-list .list-content') as HTMLDivElement;
    const programItem = document.createElement('div');
    const programId = `program-${programsList.children.length + 1}`;
    
    const program: Program = {
      id: programId,
      videoFile: input.files[0]
    };
    
    programItem.innerHTML = `
      <span>${programId}: ${input.files[0].name}</span>
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
      // Force play this program - FIXED
      playbackEngine.forcePlayProgram(program);
    });
    
    programsList.appendChild(programItem);
    playbackEngine.addProgram(program);
    input.value = '';
  }
}

function addLogo(playbackEngine: PlaybackEngine) {
  const input = document.getElementById('logo-input') as HTMLInputElement;
  if (input.files && input.files[0]) {
    const logosList = document.querySelector('#logos-list .list-content') as HTMLDivElement;
    const logoItem = document.createElement('div');
    const logoId = `logo-${logosList.children.length + 1}`;
    
    const logo: Logo = {
      id: logoId,
      imageFile: input.files[0]
    };
    
    logoItem.innerHTML = `
      <span>${logoId}: ${input.files[0].name}</span>
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
      // Force play this logo - NEW
      playbackEngine.forcePlayLogo(logo);
    });
    
    logosList.appendChild(logoItem);
    playbackEngine.addLogo(logo);
    input.value = '';
  }
}

/////////////

// dashboard.ts
// ... (imports remain the same)

export function createDashboard() {
  const dashboard = document.createElement('div');
  dashboard.id = 'dashboard';
  // ... (styling remains the same)

  dashboard.innerHTML = `
    <h3>Halloweeny Control Panel</h3>
    <form id="media-form">
      <!-- Bulk Upload Section -->
      <div style="margin-bottom: 20px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
        <h4>Bulk Upload</h4>
        <div>
          <label>Program Videos:</label>
          <input type="file" id="bulk-program-input" accept="video/*" multiple>
        </div>
        <div>
          <label>Bumper Videos:</label>
          <input type="file" id="bulk-bumper-input" accept="video/*" multiple>
        </div>
        <div>
          <label>Bumper Audios:</label>
          <input type="file" id="bulk-bumper-audio-input" accept="audio/*" multiple>
        </div>
        <div>
          <label>Logo Images:</label>
          <input type="file" id="bulk-logo-input" accept="image/*" multiple>
        </div>
        <button type="button" id="bulk-upload-btn">Bulk Upload All</button>
      </div>

      <!-- Individual Upload Section -->
      <div style="margin-bottom: 20px;">
        <h4>Individual Upload</h4>
        <div>
          <label>Program Video:</label>
          <input type="file" id="program-input" accept="video/*">
          <button type="button" id="add-program-btn">Add Program</button>
        </div>
        <div>
          <label>Bumper Video:</label>
          <input type="file" id="bumper-input" accept="video/*">
          <button type="button" id="add-bumper-btn">Add Bumper</button>
        </div>
        <div>
          <label>Bumper Audio:</label>
          <input type="file" id="bumper-audio-input" accept="audio/*">
          <button type="button" id="add-bumper-audio-btn">Add Bumper Audio</button>
        </div>
        <div>
          <label>Logo Image:</label>
          <input type="file" id="logo-input" accept="image/*">
          <button type="button" id="add-logo-btn">Add Logo</button>
        </div>
      </div>

      <div>
        <label>
          <input type="checkbox" id="auto-restart-checkbox">
          Auto-restart when finished
        </label>
      </div>
      <div>
        <label>Import Project:</label>
        <input type="file" id="import-input" multiple accept=".json,.mp4,.mov,.avi,.jpg,.png,.mp3,.wav">
        <button type="button" id="import-btn">Import</button>
      </div>
      <button type="button" id="save-btn">Save Project</button>
    </form>
    <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
      <div>Press Q to hide/show controls</div>
      <div>Press R to start playback</div>
      <div>Press S to skip</div>
      <div>Press D to seek 10 seconds ahead</div>
    </div>
  `;

  // Create floating list windows (add bumper-audio list)
  const programsList = createListWindow('programs-list', 'Programs List', 'top: 150px; right: 50px;');
  const bumpersList = createListWindow('bumpers-list', 'Bumpers List', 'top: 150px; right: 300px;');
  const bumperAudiosList = createListWindow('bumper-audios-list', 'Bumper Audios List', 'top: 150px; right: 550px;');
  const logosList = createListWindow('logos-list', 'Logos List', 'top: 150px; right: 800px;');

  // Hide list windows initially
  programsList.style.display = 'none';
  bumpersList.style.display = 'none';
  bumperAudiosList.style.display = 'none';
  logosList.style.display = 'none';

  document.body.appendChild(programsList);
  document.body.appendChild(bumpersList);
  document.body.appendChild(bumperAudiosList);
  document.body.appendChild(logosList);

  // Setup auto-restart checkbox
  const autoRestartCheckbox = dashboard.querySelector('#auto-restart-checkbox') as HTMLInputElement;
  autoRestartCheckbox.addEventListener('change', (e) => {
    playbackEngine.setAutoRestart((e.target as HTMLInputElement).checked);
  });
  // Add button event listeners
  dashboard.querySelector('#add-program-btn')?.addEventListener('click', () => addProgram(playbackEngine));
  dashboard.querySelector('#add-bumper-btn')?.addEventListener('click', () => addBumper(playbackEngine));
  dashboard.querySelector('#add-bumper-audio-btn')?.addEventListener('click', () => addBumperAudio(playbackEngine));
  dashboard.querySelector('#add-logo-btn')?.addEventListener('click', () => addLogo(playbackEngine));

  // Bulk upload button listener
  dashboard.querySelector('#bulk-upload-btn')?.addEventListener('click', () => bulkUpload(playbackEngine));

  // Add save button listener
  dashboard.querySelector('#save-btn')?.addEventListener('click', () => {
    exporter = new Exporter(
      playbackEngine.getPrograms(),
      playbackEngine.getBumpers(),
      playbackEngine.getBumperAudios(),
      playbackEngine.getLogos(),
      playbackEngine.getPositions(),
      playbackEngine.getAutoRestart()
    );
    exporter.exportAll();
  });

  // Add import button listener
  dashboard.querySelector('#import-btn')?.addEventListener('click', () => {
    const input = document.getElementById('import-input') as HTMLInputElement;
    if (input.files) {
      importer.importFiles(Array.from(input.files));
    }
  });

  // ... (draggable functionality remains the same)

  // Store reference to toggle function
  (dashboard as any).toggleLists = (show: boolean) => {
    programsList.style.display = show ? 'block' : 'none';
    bumpersList.style.display = show ? 'block' : 'none';
    bumperAudiosList.style.display = show ? 'block' : 'none';
    logosList.style.display = show ? 'block' : 'none';
  };

  return dashboard;
}

// Bulk upload function
function bulkUpload(playbackEngine: PlaybackEngine) {
  const programInput = document.getElementById('bulk-program-input') as HTMLInputElement;
  const bumperInput = document.getElementById('bulk-bumper-input') as HTMLInputElement;
  const bumperAudioInput = document.getElementById('bulk-bumper-audio-input') as HTMLInputElement;
  const logoInput = document.getElementById('bulk-logo-input') as HTMLInputElement;

  let totalAdded = 0;

  // Add programs in bulk
  if (programInput.files) {
    Array.from(programInput.files).forEach((file, index) => {
      const programId = `program-${playbackEngine.getPrograms().length + index + 1}`;
      const program: Program = {
        id: programId,
        videoFile: file
      };
      playbackEngine.addProgram(program);
      addProgramToList(program);
      totalAdded++;
    });
    programInput.value = '';
  }

  // Add bumpers in bulk
  if (bumperInput.files) {
    Array.from(bumperInput.files).forEach((file, index) => {
      const bumperId = `bumper-${playbackEngine.getBumpers().length + index + 1}`;
      const bumper: Bumper = {
        id: bumperId,
        videoFile: file
      };
      playbackEngine.addBumper(bumper);
      addBumperToList(bumper);
      totalAdded++;
    });
    bumperInput.value = '';
  }

  // Add bumper audios in bulk
  if (bumperAudioInput.files) {
    Array.from(bumperAudioInput.files).forEach((file, index) => {
      const bumperAudioId = `bumper-audio-${playbackEngine.getBumperAudios().length + index + 1}`;
      const bumperAudio: BumperAudio = {
        id: bumperAudioId,
        audioFile: file
      };
      playbackEngine.addBumperAudio(bumperAudio);
      addBumperAudioToList(bumperAudio);
      totalAdded++;
    });
    bumperAudioInput.value = '';
  }

  // Add logos in bulk
  if (logoInput.files) {
    Array.from(logoInput.files).forEach((file, index) => {
      const logoId = `logo-${playbackEngine.getLogos().length + index + 1}`;
      const logo: Logo = {
        id: logoId,
        imageFile: file
      };
      playbackEngine.addLogo(logo);
      addLogoToList(logo);
      totalAdded++;
    });
    logoInput.value = '';
  }

  if (totalAdded > 0) {
    alert(`Successfully added ${totalAdded} media files in bulk!`);
  }
}

// Updated addBumper function (removed audio file handling)
function addBumper(playbackEngine: PlaybackEngine) {
  const input = document.getElementById('bumper-input') as HTMLInputElement;
  
  if (input.files && input.files[0]) {
    const bumpersList = document.querySelector('#bumpers-list .list-content') as HTMLDivElement;
    const bumperItem = document.createElement('div');
    const bumperId = `bumper-${bumpersList.children.length + 1}`;
    
    const bumper: Bumper = {
      id: bumperId,
      videoFile: input.files[0]
    };
    
    bumperItem.innerHTML = `
      <span>${bumperId}: ${input.files[0].name}</span>
      <button class="delete-btn">×</button>
    `;
    // ... (styling and delete button setup remains the same)
    
    bumperItem.addEventListener('click', () => {
      playbackEngine.forcePlayBumper(bumper);
    });
    
    bumpersList.appendChild(bumperItem);
    playbackEngine.addBumper(bumper);
    input.value = '';
  }
}

// New addBumperAudio function
function addBumperAudio(playbackEngine: PlaybackEngine) {
  const input = document.getElementById('bumper-audio-input') as HTMLInputElement;
  
  if (input.files && input.files[0]) {
    const bumperAudiosList = document.querySelector('#bumper-audios-list .list-content') as HTMLDivElement;
    const bumperAudioItem = document.createElement('div');
    const bumperAudioId = `bumper-audio-${bumperAudiosList.children.length + 1}`;
    
    const bumperAudio: BumperAudio = {
      id: bumperAudioId,
      audioFile: input.files[0]
    };
    
    bumperAudioItem.innerHTML = `
      <span>${bumperAudioId}: ${input.files[0].name}</span>
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
      // Remove from playback engine (implementation needed)
    });
    
    bumperAudioItem.addEventListener('click', () => {
      playbackEngine.forcePlayBumperAudio(bumperAudio);
    });
    
    bumperAudiosList.appendChild(bumperAudioItem);
    playbackEngine.addBumperAudio(bumperAudio);
    input.value = '';
  }
}

// Helper functions to add items to lists (used by bulk upload)
function addProgramToList(program: Program) {
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
  });
  
  programItem.addEventListener('click', () => {
    playbackEngine.forcePlayProgram(program);
  });
  
  programsList.appendChild(programItem);
}

function addBumperToList(bumper: Bumper) {
  const bumpersList = document.querySelector('#bumpers-list .list-content') as HTMLDivElement;
  const bumperItem = document.createElement('div');
  
  bumperItem.innerHTML = `
    <span>${bumper.id}: ${bumper.videoFile.name}</span>
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
  });
  
  bumperItem.addEventListener('click', () => {
    playbackEngine.forcePlayBumper(bumper);
  });
  
  bumpersList.appendChild(bumperItem);
}

function addBumperAudioToList(bumperAudio: BumperAudio) {
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
    playbackEngine.forcePlayBumperAudio(bumperAudio);
  });
  
  bumperAudiosList.appendChild(bumperAudioItem);
}

function addLogoToList(logo: Logo) {
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
  });
  
  logoItem.addEventListener('click', () => {
    playbackEngine.forcePlayLogo(logo);
  });
  
  logosList.appendChild(logoItem);
}