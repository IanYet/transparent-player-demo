import { ImageData } from 'canvas';
import { vec2, vec4 } from 'gl-matrix';
export declare const isInbound: (u: number, v: number, w: number, h: number) => boolean;
export declare const getColor: (u: number, v: number, imageData: ImageData) => vec4;
export declare const setColor: (u: number, v: number, imageData: ImageData, color: vec4) => void;
export declare function writeBytes(arr: Uint8Array, start: number, length: number, value: 0 | 1): void;
/**
 * w&h for normalize
 * @param iptV2
 * @param iw
 * @param ih
 * @param ow
 * @param oh
 * @returns
 */
export declare function perspectiveCpuShader(iptV2: vec2, iw: number, ih: number, ow: number, oh: number, needInvert?: boolean): vec2;
//# sourceMappingURL=utils.d.ts.map