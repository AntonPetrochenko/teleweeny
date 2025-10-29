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

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'q' || e.key === 'Q') {
    dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
  }
  
  if (e.key === 'r' || e.key === 'R') {
    playbackEngine.startPlayback();
  }
});