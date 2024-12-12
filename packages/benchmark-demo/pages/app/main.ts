import { draw } from './draw'
import './style.css'

type Context = {
	cav: HTMLCanvasElement
	offCav: OffscreenCanvas
	ctx: CanvasRenderingContext2D
	offCtx: OffscreenCanvasRenderingContext2D
	renderBuffers: ImageData[]
	renderEnabled: boolean
}
async function create(): Promise<Context> {
	const cav = document.getElementById('canvas') as HTMLCanvasElement
	const offCav = new OffscreenCanvas(cav.width, cav.height)
	const ctx = cav.getContext('2d')!
	const offCtx = offCav.getContext('2d')!
	const renderBuffers: ImageData[] = []
	const canRender = false

	return {
		cav,
		offCav,
		ctx,
		offCtx,
		renderBuffers,
		renderEnabled: canRender,
	}
}

export const context = await create()

async function render() {
	requestAnimationFrame(render)
	if (!context.renderEnabled) return

	context.renderEnabled = false

	const { ctx, renderBuffers, cav } = context
	const renderBitmaps = renderBuffers.map((buffer) => window.createImageBitmap(buffer))

	for await (const bitmap of renderBitmaps) {
		ctx.drawImage(bitmap, 0, 0, cav.width, cav.height)
	}
}
requestAnimationFrame(render)

draw()
