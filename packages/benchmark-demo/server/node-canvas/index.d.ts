import { Canvas, CanvasRenderingContext2D, ImageData } from 'canvas';
type Context = {
    cav: Canvas;
    offCav: Canvas;
    ctx: CanvasRenderingContext2D;
    offCtx: CanvasRenderingContext2D;
    renderBuffers: ImageData[];
    renderEnabled: boolean;
};
export declare const context: Context;
export declare function main(): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map