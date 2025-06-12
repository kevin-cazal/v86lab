export class SaveRestoreHD extends Uint8Array {
  constructor(size) {
    super(size);
    this.size = size;
  }

  saveToFile(filename) {
    const blob = new Blob([this], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loadFromFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      this.set(new Uint8Array(arrayBuffer));
    };
    reader.readAsArrayBuffer(file);
  }
}
