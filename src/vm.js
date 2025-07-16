import { SerialTerm } from "./serialterm.js";
import { v4 as uuidv4 } from "uuid";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { V86 } from "./v86/libv86.mjs";

export class VirtualMachine {
  constructor(element, config, enable_serial_terminal = true) {
    this.uuid = uuidv4();
    this.enable_serial_terminal = enable_serial_terminal;
    this.element = element;
    this.config = config;
    this.element.innerHTML += this.renderV86();
    this.setupEventListeners();
    this.setupV86();
    if (this.enable_serial_terminal) this.setupTerminal();
  }

  setupEventListeners() {
    document
      .getElementById(`v86-save-${this.uuid}`)
      .addEventListener("click", () => this.saveState());
    document
      .getElementById(`v86-load-${this.uuid}`)
      .addEventListener("click", () => this.loadState());
    document
      .getElementById(`v86-save-hd-${this.uuid}`)
      .addEventListener("click", () => this.saveHD());
    document
      .getElementById(`v86-load-hd-${this.uuid}`)
      .addEventListener("click", () => this.loadHD());
  }

  renderV86() {
    return `
            <div id="v86-${this.uuid}" class="v86">
                ${this.renderV86Controls()}
                ${this.enable_serial_terminal ? this.renderTerminal() : ""}
            </div>
        `;
  }
  renderV86Controls() {
    return `
            <div id="v86-controls-${this.uuid}" class="v86-controls">
                ${this.renderMemStateControls()}
                ${this.renderHDControls()}
            </div>
        `;
  }

  renderMemStateControls() {
    return `
            <div id="v86-mem-state-controls-${this.uuid}" class="v86-mem-state-controls">
                    <div class="input-group"> 
                        <button id="v86-save-${this.uuid}" class="v86-button btn btn-primary">Save State</button>
                        <input type="file" id="v86-load-file-${this.uuid}" class="v86-file-input form-control" />
                        <button id="v86-load-${this.uuid}" class="v86-button btn btn-primary">Load State</button>
                    </div>
            </div>
        `;
  }

  renderTerminal() {
    return `
            <div id="terminal-${this.uuid}" class="terminal"></div>
        `;
  }

  renderHDControls() {
    return `
            <div hidden id="v86-hd-controls-${this.uuid}" class="v86-hd-controls">
                    <div class="input-group">
                      <button id="v86-save-hd-${this.uuid}" class="v86-button btn btn-primary">Save HD</button>
                      <input type="file" id="v86-load-hd-file-${this.uuid}" class="v86-file-input form-control" />
                      <button id="v86-load-hd-${this.uuid}" class="v86-button btn btn-primary">Load HD</button>
                    </div>  
            </div>
        `;
  }

  async saveState() {
    const state = await this.v86.save_state();
    const blob = new Blob([state], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `v86_state_${this.uuid}.bin`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async loadState() {
    const input = document.getElementById(`v86-load-file-${this.uuid}`);
    if (input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const state = event.target.result;
        await this.v86.restore_state(state);
        console.log(`State loaded from file: ${file.name}`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error("No file selected for loading state.");
    }
  }

  saveHD() {
    this.config.hda.saveToFile(`v86_sda_${this.uuid}.img`);
    console.log(`SDA saved as v86_sda_${this.uuid}.img`);
  }

  loadHD() {
    const input = document.getElementById(`v86-load-hd-file-${this.uuid}`);
    if (!input) {
      console.error("Input element for loading HD not found.");
      return;
    }
    if (input.files.length > 0) {
      const file = input.files[0];
      this.config.hda.loadFromFile(file);
      console.log(`Loaded HD from file: ${file.name}`);
    } else {
      console.error("No file selected for loading HD.");
    }
  }

  setupV86() {
    this.v86 = new V86(this.config);
  }

  setupTerminal() {
    this.xtermjs = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "monospace",
      theme: {
        background: "#000000",
        foreground: "#ffffff",
      },
    });
    this.xtermjs.open(document.getElementById(`terminal-${this.uuid}`));
    this.fitAddon = new FitAddon();
    this.xtermjs.loadAddon(this.fitAddon);
    this.fitAddon.fit();
    window.addEventListener("resize", () => {
      this.fitAddon.fit();
    });
    this.serialTerm = new SerialTerm(this.v86, this.xtermjs);
    this.xtermjs.write("Welcome! Press Enter to activate the terminal...\r\n");
  }
}
