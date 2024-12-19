import { vec2, vec4 } from 'gl-matrix';
import { context } from './index';
import { getColor, perspectiveCpuShader, setColor, writeBytes } from './utils';
export async function draw() {
    const { offCav, offCtx, renderBuffers } = context;
    const frameData = await readClipData(0);
    offCtx.clearRect(0, 0, offCav.width, offCav.height);
    offCtx.fillStyle = '#ffffff';
    // offCtx.fillRect(0, 0, offCav.width, offCav.height)
    offCtx.font = '30px cas';
    offCtx.textBaseline = 'top';
    offCtx.fillText('Do not go gentle into ', 10, 10);
    offCtx.fillText('that good night,', 10, 110);
    offCtx.fillText('Old age should burn and rave', 10, 410);
    offCtx.fillText('at close of day;', 10, 510);
    offCtx.fillText('Rage, rage', 10, 810);
    offCtx.fillText('against the dying of the light.', 10, 910);
    const image = offCtx.getImageData(0, 0, offCav.width, offCav.height);
    console.time('perspective process');
    const perspectiveRes = processPerspective2(image);
    console.timeEnd('perspective process');
    console.time('clip process');
    const clipRes = processClip(perspectiveRes, frameData);
    console.timeEnd('clip process');
    renderBuffers.push(clipRes);
    context.renderEnabled = true;
    offCtx.clearRect(0, 0, offCav.width, offCav.height);
}
function processPerspective2(srcImageData) {
    const { offCtx } = context;
    const tarImageData = offCtx.createImageData(srcImageData);
    for (let v = 0; v < tarImageData.height; v++) {
        for (let u = 0; u < tarImageData.width; u++) {
            const tarV = vec2.fromValues(u, v);
            const [su, sv] = perspectiveCpuShader(tarV, tarImageData.width, tarImageData.height, srcImageData.width, srcImageData.height, true);
            const [y, x] = [Math.floor(sv), Math.floor(su)];
            const [ac, bc, cc, dc] = [
                getColor(x, y, srcImageData),
                getColor(x + 1, y, srcImageData),
                getColor(x, y + 1, srcImageData),
                getColor(x + 1, y + 1, srcImageData),
            ];
            const [rightY, rightX] = [sv - y, su - x];
            const color = vec4.lerp(vec4.create(), vec4.lerp(vec4.create(), ac, bc, rightX), vec4.lerp(vec4.create(), cc, dc, rightX), rightY);
            setColor(u, v, tarImageData, color);
        }
    }
    return tarImageData;
}
/**
 *
 * @param frameNum 0-based
 */
async function readClipData(frameNum) {
    const res = await fetch('/maybe.bin');
    const allClipData = new Uint16Array(await res.arrayBuffer());
    const [clipWidth, clipHeight] = [256, 512];
    const start = clipWidth * clipHeight * frameNum;
    const end = start + clipWidth * clipHeight;
    let frameStart = 0, frameEnd = 0;
    const frameAlphaData = new Uint8Array(clipWidth * clipHeight);
    for (let i = 0, pixelNum = 0; i < allClipData.length; i++) {
        if (pixelNum === start) {
            frameStart = i;
        }
        if (pixelNum === end) {
            frameEnd = i;
            break;
        }
        pixelNum = pixelNum + allClipData[i];
    }
    const clipData = allClipData.slice(frameStart, frameEnd);
    let sig = 0;
    let resStart = 0;
    clipData.forEach((num) => {
        writeBytes(frameAlphaData, resStart, num, sig);
        sig = ((sig + 1) % 2);
        resStart += num;
    });
    return frameAlphaData;
}
function processClip(imageData, clipImageData) {
    const { offCtx } = context;
    const tarImageData = offCtx.createImageData(imageData);
    const [stepX, stepY] = [imageData.width / 256, imageData.height / 512];
    for (let i = 0; i < tarImageData.height; i++) {
        for (let j = 0; j < tarImageData.width; j++) {
            const [u, v] = [Math.floor(j / stepX), Math.floor(i / stepY)];
            const color = getColor(j, i, imageData);
            color[3] = clipImageData[v * 256 + u] ? 0 : color[3];
            setColor(j, i, tarImageData, color);
        }
    }
    return tarImageData;
}
//# sourceMappingURL=draw.js.map