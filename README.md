# v86lab

## Project Description:

This project allows running one or more Alpine Linux virtual machines directly in the browser using v86, a WebAssembly-based x86 emulator. It includes support for local networking between VMs through tcpip.js (via bridge networking with the JavaScript runtime).

Developed with Vite and Vanilla JavaScript, runs entirely on client-side.

Key features:

- Run customizable Alpine Linux VMs in-browser using **v86**:
    - Fully client-side
    - Save or load VM state
    - Save or load hard disk images

- Local network support via **tcpip.js**:
    - VMs bridged with the Javascript runtime
    - TCP/UDP listen/connect in the Javascript runtime

## Build

### Build Dependencies

- bash
- python3
- git
- docker

Run the build script:
```
chmod +x build.sh
./build.sh
```
The script will:

- Clone v86 from GitHub
- Build v86
- Build an Alpine Linux image (customizable by editing `Dockerfile.alpine_image`) to run in v86
- Run the Alpine Linux image in v86 until the end of the boot process and save the VM state (in order to skip the boot process afterward)
- Build a bundled version to use with any HTTP server

## Run

### Dev version:

```
docker run -it -p 5173:5173 v86lab_builder
```

### Bundled version

Serve the `dist` directory with any HTTP server.

