import {
	Canvas,
	CanvasRenderingContext2D,
	createCanvas,
	Image,
	ImageData,
	registerFont,
} from 'canvas'
import { draw } from '../node-canvas/draw'
import { createWriteStream } from 'fs'

type Context = {
	cav: Canvas
	offCav: Canvas
	ctx: CanvasRenderingContext2D
	offCtx: CanvasRenderingContext2D
	renderBuffers: ImageData[]
	renderEnabled: boolean
}

export const base_public_url =
	'/Users/ian/Projects/Personal/transparent-player-demo/packages/benchmark-demo/public/'

async function create(): Promise<Context> {
	const cav = createCanvas(540, 960)
	const offCav = createCanvas(540, 960)
	const ctx = cav.getContext('2d')!
	const offCtx = offCav.getContext('2d')!

	const renderBuffers: ImageData[] = []
	const canRender = true

	registerFont(`${base_public_url}CascadiaCodePL.ttf`, {
		family: 'cas',
	})

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

const createImage = (imageData: ImageData): Promise<Image> => {
	const tempCanvas = createCanvas(imageData.width, imageData.height)
	const tempCtx = tempCanvas.getContext('2d')
	tempCtx.putImageData(imageData, 0, 0)

	return new Promise((resolve) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.src = tempCanvas.toDataURL()
	})
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

	const os = createWriteStream('node-canvas.png')
	const stream = cav.createPNGStream()
	stream.pipe(os)
	os.on('finish', () => console.log('saved'))
}
export async function main() {
	console.time('draw: ')
	await draw()
	console.timeEnd('draw: ')
	await render()
}
