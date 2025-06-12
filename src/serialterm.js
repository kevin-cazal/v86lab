export class SerialTerm {
  constructor(emulator, terminal) {
    this.terminal = terminal;
    this.emulator = emulator;
    this.setupListeners();
  }

  setupListeners() {
    this.terminal.onKey((evt) => {
      this.tx(evt);
    });
    this.emulator.add_listener("serial0-output-byte", (byte) => {
      this.rx(byte);
    });
  }

  tx(evt) {
    this.emulator.serial0_send(evt.key);
  }

  rx(byte) {
    this.terminal.write(String.fromCharCode(byte));
  }
}
