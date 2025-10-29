import { PlaybackEngine } from './playback';
import type { Program, Bumper, Logo } from './types';

let playbackEngine: PlaybackEngine;

export function setPlaybackEngine(engine: PlaybackEngine) {
  playbackEngine = engine;
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
      <button type="button" id="save-btn">Save</button>
    </form>
    <div>
      <label><input type="checkbox" id="show-programs"> Show Programs List</label>
      <label><input type="checkbox" id="show-bumpers"> Show Bumpers List</label>
      <label><input type="checkbox" id="show-logos"> Show Logos List</label>
    </div>
  `;

  // Create floating list windows
  const programsList = createListWindow('programs-list', 'Programs List', 'top: 150px; right: 50px;');
  const bumpersList = createListWindow('bumpers-list', 'Bumpers List', 'top: 150px; right: 300px;');
  const logosList = createListWindow('logos-list', 'Logos List', 'top: 150px; right: 550px;');

  document.body.appendChild(programsList);
  document.body.appendChild(bumpersList);
  document.body.appendChild(logosList);

  // Toggle list windows
  dashboard.querySelector('#show-programs')?.addEventListener('change', (e) => {
    programsList.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none';
  });

  dashboard.querySelector('#show-bumpers')?.addEventListener('change', (e) => {
    bumpersList.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none';
  });

  dashboard.querySelector('#show-logos')?.addEventListener('change', (e) => {
    logosList.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none';
  });

  // Add button event listeners
  dashboard.querySelector('#add-program-btn')?.addEventListener('click', () => addProgram(playbackEngine));
  dashboard.querySelector('#add-bumper-btn')?.addEventListener('click', () => addBumper(playbackEngine));
  dashboard.querySelector('#add-logo-btn')?.addEventListener('click', () => addLogo(playbackEngine));

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
    
    programItem.textContent = `${programId}: ${input.files[0].name}`;
    programItem.style.cursor = 'pointer';
    programItem.style.padding = '5px';
    programItem.style.margin = '2px 0';
    programItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    programItem.style.borderRadius = '3px';
    
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
    bumperItem.textContent = `${bumperId}: ${videoInput.files[0].name}${audioText}`;
    bumperItem.style.cursor = 'pointer';
    bumperItem.style.padding = '5px';
    bumperItem.style.margin = '2px 0';
    bumperItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    bumperItem.style.borderRadius = '3px';
    
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
    
    logoItem.textContent = `${logoId}: ${input.files[0].name}`;
    logoItem.style.cursor = 'pointer';
    logoItem.style.padding = '5px';
    logoItem.style.margin = '2px 0';
    logoItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    logoItem.style.borderRadius = '3px';
    
    logosList.appendChild(logoItem);
    playbackEngine.addLogo(logo);
    input.value = '';
  }
}