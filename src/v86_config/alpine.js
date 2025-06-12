import { SaveRestoreHD } from "../hd.js";

export const config = {
  wasm_path: "/wasm/v86.wasm",
  memory_size: 512 * 1024 * 1024,
  bios: { url: "/bios/seabios.bin" },
  filesystem: {
    baseurl: "/images/alpine-rootfs-flat",
    basefs: "/images/alpine-fs.json",
  },
  autostart: true,
  bzimage_initrd_from_filesystem: true,
  cmdline:
    "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable console=ttyS0",
    disable_speaker: true,
    disable_mouse: true,
    disable_keyboard: true,
    hda: new SaveRestoreHD(32 * 1024 * 1024),
    net_device: {
        type: "virtio",
    },
    initial_state: { url: "/images/alpine-state.bin" }
};
