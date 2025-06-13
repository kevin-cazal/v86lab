#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"
V86_DIR=v86
OUT_DIR=images

if [[ ! -d $V86_DIR ]]; then
    echo "Cloning v86 repository..."
    git clone --depth 1 https://github.com/copy/v86.git "$V86_DIR"
else
  echo "Using existing v86 directory."
fi

docker build . --file Dockerfile.v86_builder --rm --tag v86_builder
docker run --rm -v "$PWD/$V86_DIR":/v86 v86_builder bash -c 'PATH="${HOME}/.cargo/bin:${PATH}" make all'

if [[ ! -d "$OUT_DIR" ]]; then
    echo "Creating images directory..."
    mkdir -p "$OUT_DIR"
else
  echo "Using existing images directory."
fi

OUT_ROOTFS_TAR="$OUT_DIR"/alpine-rootfs.tar
OUT_ROOTFS_FLAT="$OUT_DIR"/alpine-rootfs-flat
OUT_FSJSON="$OUT_DIR"/alpine-fs.json
CONTAINER_NAME=alpine-v86
IMAGE_NAME=i386/alpine-v86

docker build . --file Dockerfile.alpine_image --platform linux/386 --rm --tag "$IMAGE_NAME"
docker rm "$CONTAINER_NAME" || true
docker create --platform linux/386 -t -i --name "$CONTAINER_NAME" "$IMAGE_NAME"

docker export "$CONTAINER_NAME" -o "$OUT_ROOTFS_TAR"

# https://github.com/iximiuz/docker-to-linux/issues/19#issuecomment-1242809707
tar -f "$OUT_ROOTFS_TAR" --delete ".dockerenv" || true

"$V86_DIR"/tools/fs2json.py --out "$OUT_FSJSON" "$OUT_ROOTFS_TAR" 1>/dev/null

# Note: Not deleting old files here
mkdir -p "$OUT_ROOTFS_FLAT"
"$V86_DIR"/tools/copy-to-sha256.py "$OUT_ROOTFS_TAR" "$OUT_ROOTFS_FLAT"

echo "$OUT_ROOTFS_TAR", "$OUT_ROOTFS_FLAT" and "$OUT_FSJSON" created.

docker run -i --rm -v "$PWD/$OUT_DIR:/$OUT_DIR" -v "$PWD/$V86_DIR:/$V86_DIR" node:lts << EOF
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import { V86 } from '/${V86_DIR}/build/libv86.mjs';


const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const V86_ROOT = path.join(__dirname, '/${V86_DIR}');
const OUTPUT_FILE = '/${OUT_DIR}/alpine-state.bin';

var emulator = new V86({
    wasm_path: path.join(V86_ROOT, 'build/v86.wasm'),
    bios: { url: path.join(V86_ROOT, 'bios/seabios.bin') },
    autostart: true,
    memory_size: 512 * 1024 * 1024,
    bzimage_initrd_from_filesystem: true,
    cmdline: 'rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_free=on',
    filesystem: {
        baseurl: '/${OUT_DIR}/alpine-rootfs-flat',
        basefs: '/${OUT_DIR}/alpine-fs.json',
    },
    net_device: {
        type: "virtio"
    },
    hda: new Uint8Array(32 * 1024 * 1024)
});

console.log('Now booting, please stand by ...');

let serial_text = '';
let booted = false;

emulator.add_listener('serial0-output-byte', function(byte)
{
    const c = String.fromCharCode(byte);
    process.stdout.write(c);

    serial_text += c;

    if(!booted && serial_text.endsWith(':~# '))
    {
        booted = true;

        emulator.serial0_send('sync;echo 3 >/proc/sys/vm/drop_caches;rmmod ne2k-pci;rmmod virtio-net\n');

        setTimeout(async function ()
            {
                const s = await emulator.save_state();

                fs.writeFile(OUTPUT_FILE, new Uint8Array(s), function(e)
                    {
                        if(e) throw e;
                        console.log('Saved as ' + OUTPUT_FILE);
                        emulator.destroy();
                    });
            }, 10 * 1000);
    }
});
EOF

docker build . --file Dockerfile.vite_v86lab_builder --rm --tag v86lab_builder
mkdir -p dist
docker run  --rm -v "$PWD/dist":/dist v86lab_builder bash -c 'cp -r dist/* /dist'
