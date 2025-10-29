import type { Program, Bumper, Logo } from './types';

export class Exporter {
  private programs: Program[] = [];
  private bumpers: Bumper[] = [];
  private logos: Logo[] = [];
  private positions: Map<string, { x: number; y: number; scale: number }>;

  constructor(
    programs: Program[], 
    bumpers: Bumper[], 
    logos: Logo[], 
    positions: Map<string, { x: number; y: number; scale: number }>
  ) {
    this.programs = programs;
    this.bumpers = bumpers;
    this.logos = logos;
    this.positions = positions;
  }

  async exportAll() {
    const internalName = prompt('Enter internal name for export:');
    if (!internalName) return;

    // Convert Map to plain object for JSON serialization
    const positionsObject: Record<string, { x: number; y: number; scale: number }> = {};
    this.positions.forEach((value, key) => {
      positionsObject[key] = value;
    });

    // Create JSON data
    const jsonData = {
      programs: this.programs.map(program => ({
        id: program.id,
        filename: `${internalName}-${program.id}.${this.getFileExtension(program.videoFile.name)}`,
        position: this.positions.get(program.id) || { x: 0, y: 0, scale: 1 }
      })),
      bumpers: this.bumpers.map(bumper => ({
        id: bumper.id,
        videoFilename: `${internalName}-${bumper.id}-video.${this.getFileExtension(bumper.videoFile.name)}`,
        audioFilename: bumper.audioFile ? 
          `${internalName}-${bumper.id}-audio.${this.getFileExtension(bumper.audioFile.name)}` : null
      })),
      logos: this.logos.map(logo => ({
        id: logo.id,
        filename: `${internalName}-${logo.id}.${this.getFileExtension(logo.imageFile.name)}`
      })),
      positions: positionsObject // Include positions in export
    };

    // Download JSON
    this.downloadFile(
      JSON.stringify(jsonData, null, 2),
      `${internalName}-config.json`,
      'application/json'
    );

    // Download all media files
    this.programs.forEach(program => {
      this.downloadFile(program.videoFile, `${internalName}-${program.id}.${this.getFileExtension(program.videoFile.name)}`);
    });

    this.bumpers.forEach(bumper => {
      this.downloadFile(bumper.videoFile, `${internalName}-${bumper.id}-video.${this.getFileExtension(bumper.videoFile.name)}`);
      if (bumper.audioFile) {
        this.downloadFile(bumper.audioFile, `${internalName}-${bumper.id}-audio.${this.getFileExtension(bumper.audioFile.name)}`);
      }
    });

    this.logos.forEach(logo => {
      this.downloadFile(logo.imageFile, `${internalName}-${logo.id}.${this.getFileExtension(logo.imageFile.name)}`);
    });

    alert(`Export completed! Downloaded ${this.programs.length} programs, ${this.bumpers.length} bumpers, and ${this.logos.length} logos.`);
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  private downloadFile(file: File | string, filename: string, type?: string) {
    const blob = typeof file === 'string' ? new Blob([file], { type }) : file;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}