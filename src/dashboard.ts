import { PlaybackEngine } from './playback';
import type { Program, Bumper, Logo } from './types';
import { Exporter } from './export';
import { Importer } from './import';


let playbackEngine: PlaybackEngine;
let exporter: Exporter;
let importer: Importer;

export function setPlaybackEngine(engine: PlaybackEngine) {
  playbackEngine = engine;
  exporter = new Exporter([], [], [], new Map()); // Will be updated when media is added
  importer = new Importer(engine);
}

export function createDashboard() {
  const dashboard = document.createElement('div');
  dashboard.id = 'dashboard';
  dashboard.style.position = 'fixed';
  dashboard.style.top = '50px';
  dashboard.style.left = '50px';
  dashboard.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  dashboard.style.color = 'white';
  dashboard.style.padding = '20px';
  dashboard.style.borderRadius = '10px';
  dashboard.style.zIndex = '1000';
  dashboard.style.cursor = 'move';

  dashboard.innerHTML = `
    <h3>Halloweeny Control Panel</h3>
    <form id="media-form">
      <div>
        <label>Program Video:</label>
        <input type="file" id="program-input" accept="video/*">
        <button type="button" id="add-program-btn">Add Program</button>
      </div>
      <div>
        <label>Bumper Video:</label>
        <input type="file" id="bumper-video-input" accept="video/*">
        <button type="button" id="add-bumper-btn">Add Bumper</button>
      </div>
      <div>
        <label>Bumper Audio (optional):</label>
        <input type="file" id="bumper-audio-input" accept="audio/*">
      </div>
      <div>
        <label>Logo Image:</label>
        <input type="file" id="logo-input" accept="image/*">
        <button type="button" id="add-logo-btn">Add Logo</button>
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

  // Remove the checkboxes section entirely and add the help text instead

  // Create floating list windows (initially hidden)
  const programsList = createListWindow('programs-list', 'Programs List', 'top: 150px; right: 50px;');
  const bumpersList = createListWindow('bumpers-list', 'Bumpers List', 'top: 150px; right: 300px;');
  const logosList = createListWindow('logos-list', 'Logos List', 'top: 150px; right: 550px;');

  // Hide list windows initially
  programsList.style.display = 'none';
  bumpersList.style.display = 'none';
  logosList.style.display = 'none';

  document.body.appendChild(programsList);
  document.body.appendChild(bumpersList);
  document.body.appendChild(logosList);

  // Add button event listeners
  dashboard.querySelector('#add-program-btn')?.addEventListener('click', () => addProgram(playbackEngine));
  dashboard.querySelector('#add-bumper-btn')?.addEventListener('click', () => addBumper(playbackEngine));
  dashboard.querySelector('#add-logo-btn')?.addEventListener('click', () => addLogo(playbackEngine));

  // Add save button listener
  dashboard.querySelector('#save-btn')?.addEventListener('click', () => {
    // Update exporter with current data
    exporter = new Exporter(
        playbackEngine.getPrograms(),
        playbackEngine.getBumpers(), 
        playbackEngine.getLogos(),
        playbackEngine.getPositions()
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

  // Make draggable
  let isDragging = false;
  let offsetX: number, offsetY: number;

  dashboard.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - dashboard.offsetLeft;
    offsetY = e.clientY - dashboard.offsetTop;
    dashboard.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dashboard.style.left = `${e.clientX - offsetX}px`;
    dashboard.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    dashboard.style.cursor = 'move';
  });

  // Store reference to toggle function
  (dashboard as any).toggleLists = (show: boolean) => {
    programsList.style.display = show ? 'block' : 'none';
    bumpersList.style.display = show ? 'block' : 'none';
    logosList.style.display = show ? 'block' : 'none';
  };

  return dashboard;
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
      // Force play this program
      playbackEngine.forcePlayProgram(program);
    });
    
    programsList.appendChild(programItem);
    playbackEngine.addProgram(program);
    input.value = '';
  }
}

function addBumper(playbackEngine: PlaybackEngine) {
  const videoInput = document.getElementById('bumper-video-input') as HTMLInputElement;
  const audioInput = document.getElementById('bumper-audio-input') as HTMLInputElement;
  
  if (videoInput.files && videoInput.files[0]) {
    const bumpersList = document.querySelector('#bumpers-list .list-content') as HTMLDivElement;
    const bumperItem = document.createElement('div');
    const bumperId = `bumper-${bumpersList.children.length + 1}`;
    
    const bumper: Bumper = {
      id: bumperId,
      videoFile: videoInput.files[0],
      audioFile: audioInput.files && audioInput.files[0] ? audioInput.files[0] : undefined
    };
    
    const audioText = bumper.audioFile ? ` + Audio` : '';
    bumperItem.innerHTML = `
      <span>${bumperId}: ${videoInput.files[0].name}${audioText}</span>
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
      playbackEngine.forcePlayBumper(bumper);
    });
    
    bumpersList.appendChild(bumperItem);
    playbackEngine.addBumper(bumper);
    videoInput.value = '';
    audioInput.value = '';
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
    
    logosList.appendChild(logoItem);
    playbackEngine.addLogo(logo);
    input.value = '';
  }
}