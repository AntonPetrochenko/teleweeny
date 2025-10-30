import './style.css';
import { createDashboard, setPlaybackEngine } from './dashboard';
import { PlaybackEngine } from './playback';

const videoElement = document.createElement('video');
videoElement.id = 'main-video';
videoElement.style.width = '100vw';
videoElement.style.height = '100vh';
videoElement.style.objectFit = 'contain';

document.body.appendChild(videoElement);

// Create playback engine
const playbackEngine = new PlaybackEngine(videoElement);
setPlaybackEngine(playbackEngine);

// Create dashboard (initially hidden)
const dashboard = createDashboard();
dashboard.style.display = 'none';
document.body.appendChild(dashboard);

// Function to toggle list windows
function toggleListWindows(show: boolean) {
  const programsList = document.getElementById('programs-list');
  const bumpersList = document.getElementById('bumpers-list');
  const bumperAudiosList = document.getElementById('bumper-audios-list');
  const logosList = document.getElementById('logos-list');
  
  if (programsList) programsList.style.display = show ? 'block' : 'none';
  if (bumpersList) bumpersList.style.display = show ? 'block' : 'none';
  if (bumperAudiosList) bumperAudiosList.style.display = show ? 'block' : 'none';
  if (logosList) logosList.style.display = show ? 'block' : 'none';
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'q' || e.key === 'Q') {
    const isVisible = dashboard.style.display === 'block';
    dashboard.style.display = isVisible ? 'none' : 'block';
    toggleListWindows(!isVisible);
  }
  
  if (e.key === 'r' || e.key === 'R') {
    playbackEngine.startPlayback();
  }
  
  // Space key to pause/resume
  if (e.key === ' ') {
    e.preventDefault(); // Prevent page scroll
    playbackEngine.togglePause();
  }
  
  // S key to skip to next program
  if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    playbackEngine.skipToNextProgram();
  }
  
  // D key to jump 10 seconds forward
  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    playbackEngine.jumpForward(10);
  }
});