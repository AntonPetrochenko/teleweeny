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

  async exportAll() {
    const internalName = prompt('Enter internal name for export:');
    if (!internalName) return;

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
    });

    this.bumperAudios.forEach(bumperAudio => {
      this.downloadFile(bumperAudio.audioFile, `${internalName}-${bumperAudio.id}-audio.${this.getFileExtension(bumperAudio.audioFile.name)}`);
    });

    this.logos.forEach(logo => {
      this.downloadFile(logo.imageFile, `${internalName}-${logo.id}.${this.getFileExtension(logo.imageFile.name)}`);
    });

    alert(`Export completed! Downloaded ${this.programs.length} programs, ${this.bumpers.length} bumpers, ${this.bumperAudios.length} bumper audios, and ${this.logos.length} logos.`);
  }

}
