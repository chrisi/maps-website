export interface StringContentHandler {
  (filename: string, content: string): void
}

export interface ArrayBufferContentHandler {
  (filename: string, content: ArrayBuffer): void
}

//
// FILE PROCESSING FOR BMS FILES
//
export class DropFileHandler {

  private filename = "";

  private iniHandler: ((filename: string, content: string) => void) | null = null;

  public onIniLoaded(cb: StringContentHandler) {
    this.iniHandler = cb;
  }

  private pngHandler: ((filename: string, dataUrl: string) => void) | null = null;

  public onPngLoaded(cb: StringContentHandler) {
    this.pngHandler = cb;
  }

  private weatherMapHandler: ((filename: string, data: ArrayBuffer) => void) | null = null;

  public onWeatherMapLoaded(cb: ArrayBufferContentHandler) {
    this.weatherMapHandler = cb;
  }

  private grib2Handler: ((filename: string, data: ArrayBuffer) => void) | null = null;

  public onGrib2Loaded(cb: ArrayBufferContentHandler) {
    this.weatherMapHandler = cb;
  }

  // Disable Default behavior and allow dropped files to be handled
  public allow(ev: DragEvent) {
    ev.preventDefault();
  }

  // Handle Files Dropped on this window (.ini .fmap or .png)
  // The .ini is for mission files
  // The .fmap is for the weather data
  // The .png is for restoring the Whiteboard
  // The gfs. is for importing GFS grib2 data
  public process(ev: DragEvent) {
    ev.preventDefault();

    const items = ev.dataTransfer!.items

    if (items) {
      const reader = new FileReader();
      reader.addEventListener('load', e => {
        const res = e.target?.result;
        if (!res) return;
        switch (typeof res) {
          case 'string':
            if (this.iniHandler && this.filename.endsWith(".ini"))
              this.iniHandler(this.filename, res);
            if (this.pngHandler && this.filename.endsWith(".png")) {
              this.pngHandler(this.filename, res);
            }
            break;
          case 'object':
            if (this.weatherMapHandler && this.filename.endsWith(".fmap")) {
              this.weatherMapHandler(this.filename, res);
              return;
            }
            if (this.grib2Handler && this.filename.startsWith("gfs.")) {
              this.grib2Handler(this.filename, res);
              return;
            }
            break;
          default:
            console.log("unknown file type: " + typeof res);
            break;
        }
      });

      // Use DataTransferItemList interface for Modern Browers
      for (let i = 0; i < items.length; i++) {
        // If dropped items aren't files, reject them
        if (items[i]!.kind === 'file') {
          const file = items[i]!.getAsFile();
          if (file) {
            this.filename = file.name.repeat(1);
            if (this.filename.endsWith(".ini")) reader.readAsText(file);
            if (this.filename.endsWith(".fmap")) reader.readAsArrayBuffer(file);
            if (this.filename.endsWith(".png")) reader.readAsDataURL(file);
            if (this.filename.startsWith("gfs.")) reader.readAsArrayBuffer(file);
          }
        }
      }
    }
  }
}
