import "../node_modules/@xterm/xterm/css/xterm.css";
import { createStack } from "tcpip";
import { createV86NetworkStream } from "@tcpip/v86";
import { VirtualMachine } from "./vm.js";
import { config as alpine_config } from "./v86_config/alpine.js";
import { marked } from "marked";
import { baseUrl } from "marked-base-url";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";


class NetworkLab {
  constructor(element, size, bridge_ip = "192.168.42.1/24", bridge_mac = "42:00:00:00:00:01") {
    this.element = element;
    this.size = size;
    this.bridge_ip = bridge_ip;
    this.bridge_mac = bridge_mac;
    this.vms = new Array(size).fill(null);
    this.vms_nic = new Array(size).fill(null);
    this.bridge_ports = new Array(size).fill(null);
    this.element.innerHTML += this.renderLab();
    this.bridge = this.init_bridge();
  }

  async init_bridge() {
    this.stack = await createStack();
    for (let i = 0; i < this.size; i++) {
      this.vms[i] = new VirtualMachine(document.querySelector(`#vm${i + 1}`), alpine_config, true, 32);
      this.vms_nic[i] = createV86NetworkStream(this.vms[i].v86);
      this.bridge_ports[i] = await this.stack.createTapInterface();
    }
    for (let i = 0; i < this.size; i++) {
      this.bridge_ports[i].readable.pipeTo(this.vms_nic[i].writable);
      this.vms_nic[i].readable.pipeTo(this.bridge_ports[i].writable);
    }
    const bridge = await this.stack.createBridgeInterface({
      ports: this.bridge_ports,
      ip: this.bridge_ip,
      mac: this.bridge_mac,
    });
    console.log(`Bridge created with IP: ${this.bridge_ip} and MAC: ${this.bridge_mac}`);
    return bridge;
  }

  renderLab() {
    return `
      <div class="lab">
        ${Array.from({ length: this.size }, (_, i) => `
          <div id="vm${i + 1}" class="vm"></div>
        `).join('')}
      </div>
    `;
  }
}

window.v86lab = new NetworkLab(document.querySelector("#app"), 1);
window.mdviewer = marked
window.mdviewer.use(baseUrl("https://raw.githubusercontent.com/kevin-cazal/discover-linux-1/refs/heads/main/"));
md_content = fetch("https://raw.githubusercontent.com/kevin-cazal/discover-linux-1/refs/heads/main/shell_101_fr.md")
  .then(response => response.text())
  .then(text => {
    window.mdviewer.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false,
    });
    document.getElementById('mdviewer').innerHTML = window.mdviewer.parse(text);
  })
  .catch(error => console.error("Error loading markdown content:", error));
