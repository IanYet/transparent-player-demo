import { Canvas, GlobalFonts, ImageData, SKRSContext2D } from '@napi-rs/canvas'
import { draw } from '../napi-rs-canvas/draw'
import fs from 'fs/promises'

type Context = {
	cav: Canvas
	offCav: Canvas
	ctx: SKRSContext2D
	offCtx: SKRSContext2D
	renderBuffers: ImageData[]
	renderEnabled: boolean
}

export const base_public_url =
	'/Users/ian/Projects/Personal/transparent-player-demo/packages/benchmark-demo/public/'

async function create(): Promise<Context> {
	const cav = new Canvas(540, 960)
	const offCav = new Canvas(540, 960)
	const ctx = cav.getContext('2d')!
	const offCtx = offCav.getContext('2d')!

	const renderBuffers: ImageData[] = []
	const canRender = true

	GlobalFonts.registerFromPath(`${base_public_url}CascadiaCodePL.ttf`, 'cas')

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

const createImage = async (imageData: ImageData): Promise<Canvas> => {
	const tempCanvas = new Canvas(imageData.width, imageData.height)
	const tempCtx = tempCanvas.getContext('2d')
	tempCtx.putImageData(imageData as globalThis.ImageData, 0, 0)

	return tempCanvas
}

async function render() {
	// render or export
	const { ctx, renderBuffers, cav } = context
	ctx.clearRect(0, 0, cav.width, cav.height)

	const renderBitmaps = renderBuffers.map((buffer) => createImage(buffer))

	for await (const bitmap of renderBitmaps) {
		ctx.drawImage(bitmap, 0, 0, cav.width, cav.height)
	}
	renderBuffers.length = 0

	const pngData = await cav.encode('png')
	await fs.writeFile('napi-rs-canvas.png', pngData)
}
export async function main() {
	console.time('draw: ')
	await draw()
	console.timeEnd('draw: ')
	await render()
}
