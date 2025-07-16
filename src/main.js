import "../node_modules/@xterm/xterm/css/xterm.css";
import { createStack } from "tcpip";
import { createV86NetworkStream } from "@tcpip/v86";
import { VirtualMachine } from "./vm.js";
import { config as alpine_config } from "./v86_config/alpine.js";
import { marked } from "marked";
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
document.getElementById('mdviewer').innerHTML = marked.parse(`
# Welcome to the Network Lab
This lab allows you to create and manage virtual machines connected through a network bridge. Each VM runs Alpine Linux and can communicate with each other through the bridge interface.

## Features
- Create multiple VMs
- Network connectivity between VMs
- Customizable bridge settings
- Interactive terminal interface
## Usage
1. Open the terminal in each VM to start using Alpine Linux.
2. Use the network tools available in Alpine to test connectivity between VMs.
3. Modify the bridge settings as needed in the source code.
 bash
ls -l /dev/

You can run commands like or  in the terminal of each VM to check the network status and connectivity.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit 
anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur       
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur

`);