export class DropFileHandler {

  private filename = "";

  private iniHandler: ((filename: string, content: string) => void)[] = [];

  public onIniLoaded(cb: ((filename: string, content: string) => void)) {
    this.iniHandler.push(cb);
  }

  private pngHandler: ((filename: string, dataUrl: string) => void)[] = [];

  public onPngLoaded(cb: ((filename: string, content: string) => void)) {
    this.pngHandler.push(cb);
  }

  private weatherMapHandler: ((filename: string, data: ArrayBuffer) => void)[] = [];

  public onWeatherMapLoaded(cb: ((filename: string, data: ArrayBuffer) => void)) {
    this.weatherMapHandler.push(cb);
  }

  private grib2Handler: ((filename: string, data: ArrayBuffer) => void)[] = [];

  public onGrib2Loaded(cb: ((filename: string, data: ArrayBuffer) => void)) {
    this.grib2Handler.push(cb);
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
            if (this.filename.endsWith(".ini"))
              this.iniHandler.forEach(cb => cb(this.filename, res));
            if (this.filename.endsWith(".png")) {
              this.pngHandler.forEach(cb => cb(this.filename, res));
            }
            break;
          case 'object':
            if (this.filename.endsWith(".fmap"))
              this.weatherMapHandler.forEach(cb => cb(this.filename, res));
            if (this.filename.startsWith("gfs."))
              this.grib2Handler.forEach(cb => cb(this.filename, res));
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
            console.log("process file: " + file.name);
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
