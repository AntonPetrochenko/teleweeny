import type { Program, Bumper, Logo, BumperAudio } from './types';

export class Exporter {
  private programs: Program[] = [];
  private bumpers: Bumper[] = [];
  private logos: Logo[] = [];
  private positions: Map<string, { x: number; y: number; scale: number }>;
  private autoRestart: boolean;
  private bumperAudios: BumperAudio[] = [];

  constructor(
    programs: Program[],
    bumpers: Bumper[],
    bumperAudios: BumperAudio[],
    logos: Logo[],
    positions: Map<string, { x: number; y: number; scale: number }>,
    autoRestart: boolean
  ) {
    this.programs = programs;
    this.bumpers = bumpers;
    this.bumperAudios = bumperAudios;
    this.logos = logos;
    this.positions = positions;
    this.autoRestart = autoRestart;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  private downloadFile(file: File | string, filename: string, type?: string): Promise<void> {
    return new Promise((resolve) => {
      const blob = typeof file === 'string' ? new Blob([file], { type }) : file;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 100);
    });
  }

  private async downloadWithDelay(files: Array<{ file: File | string; filename: string; type?: string }>, delayMs: number = 200): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const { file, filename, type } = files[i];
      await this.downloadFile(file, filename, type);
      
      // Add delay between downloads to prevent browser limits
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  async exportAll() {
    const internalName = prompt('Enter internal name for export:');
    if (!internalName) return;

    // Show loading indicator
    const originalSaveText = (document.getElementById('save-btn') as HTMLButtonElement)?.textContent;
    if (document.getElementById('save-btn')) {
      (document.getElementById('save-btn') as HTMLButtonElement).textContent = '⏳ Exporting...';
      (document.getElementById('save-btn') as HTMLButtonElement).disabled = true;
    }

    try {
      const positionsObject: Record<string, { x: number; y: number; scale: number }> = {};
      this.positions.forEach((value, key) => {
        positionsObject[key] = value;
      });

      // Create JSON data with bumper audios
      const jsonData = {
        programs: this.programs.map(program => ({
          id: program.id,
          filename: `${internalName}-${program.id}.${this.getFileExtension(program.videoFile.name)}`,
          position: this.positions.get(program.id) || { x: 0, y: 0, scale: 1 }
        })),
        bumpers: this.bumpers.map(bumper => ({
          id: bumper.id,
          videoFilename: `${internalName}-${bumper.id}-video.${this.getFileExtension(bumper.videoFile.name)}`
        })),
        bumperAudios: this.bumperAudios.map(bumperAudio => ({
          id: bumperAudio.id,
          audioFilename: `${internalName}-${bumperAudio.id}-audio.${this.getFileExtension(bumperAudio.audioFile.name)}`
        })),
        logos: this.logos.map(logo => ({
          id: logo.id,
          filename: `${internalName}-${logo.id}.${this.getFileExtension(logo.imageFile.name)}`
        })),
        positions: positionsObject,
        autoRestart: this.autoRestart
      };

      // Prepare all files for download
      const filesToDownload: Array<{ file: File | string; filename: string; type?: string }> = [];

      // Add JSON config file first
      filesToDownload.push({
        file: JSON.stringify(jsonData, null, 2),
        filename: `${internalName}-config.json`,
        type: 'application/json'
      });

      // Add program videos
      this.programs.forEach(program => {
        filesToDownload.push({
          file: program.videoFile,
          filename: `${internalName}-${program.id}.${this.getFileExtension(program.videoFile.name)}`
        });
      });

      // Add bumper videos
      this.bumpers.forEach(bumper => {
        filesToDownload.push({
          file: bumper.videoFile,
          filename: `${internalName}-${bumper.id}-video.${this.getFileExtension(bumper.videoFile.name)}`
        });
      });

      // Add bumper audios
      this.bumperAudios.forEach(bumperAudio => {
        filesToDownload.push({
          file: bumperAudio.audioFile,
          filename: `${internalName}-${bumperAudio.id}-audio.${this.getFileExtension(bumperAudio.audioFile.name)}`
        });
      });

      // Add logo images
      this.logos.forEach(logo => {
        filesToDownload.push({
          file: logo.imageFile,
          filename: `${internalName}-${logo.id}.${this.getFileExtension(logo.imageFile.name)}`
        });
      });

      // Show progress for large exports
      if (filesToDownload.length > 10) {
        alert(`Starting export of ${filesToDownload.length} files. This may take a moment...`);
      }

      // Download files with delays to prevent browser limits
      const BATCH_SIZE = 8; // Conservative batch size
      const DELAY_BETWEEN_BATCHES = 500; // 500ms between batches
      const DELAY_BETWEEN_FILES = 150; // 150ms between files in same batch

      for (let i = 0; i < filesToDownload.length; i += BATCH_SIZE) {
        const batch = filesToDownload.slice(i, i + BATCH_SIZE);
        
        // Download files in current batch with small delays
        await this.downloadWithDelay(batch, DELAY_BETWEEN_FILES);
        
        // Add longer delay between batches if there are more files to download
        if (i + BATCH_SIZE < filesToDownload.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      alert(`✅ Export completed! Downloaded ${this.programs.length} programs, ${this.bumpers.length} bumpers, ${this.bumperAudios.length} bumper audios, and ${this.logos.length} logos.`);

    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed. Please try again with fewer files or check the console for errors.');
    } finally {
      // Restore save button
      if (document.getElementById('save-btn')) {
        (document.getElementById('save-btn') as HTMLButtonElement).textContent = originalSaveText || '💾 Save Project';
        (document.getElementById('save-btn') as HTMLButtonElement).disabled = false;
      }
    }
  }

  // Alternative method for very large exports (user-initiated batches)
  async exportInBatches() {
    const internalName = prompt('Enter internal name for export:');
    if (!internalName) return;

    const totalFiles = this.programs.length + this.bumpers.length + this.bumperAudios.length + this.logos.length + 1; // +1 for JSON
    
    if (totalFiles > 20) {
      const shouldBatch = confirm(`This will export ${totalFiles} files. For better reliability, we recommend exporting in batches. Continue with automatic batching?`);
      if (!shouldBatch) return;
    }

    await this.exportAll(); // Use the main method which now includes batching
  }
}