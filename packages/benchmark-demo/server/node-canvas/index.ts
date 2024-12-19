import {
	Canvas,
	CanvasRenderingContext2D,
	createCanvas,
	Image,
	ImageData,
	registerFont,
} from 'canvas'
import { draw } from './draw'
import { createWriteStream } from 'fs'

type Context = {
	cav: Canvas
	offCav: Canvas
	ctx: CanvasRenderingContext2D
	offCtx: CanvasRenderingContext2D
	renderBuffers: ImageData[]
	renderEnabled: boolean
}

async function create(): Promise<Context> {
	const cav = createCanvas(540, 960)
	const offCav = createCanvas(540, 960)
	const ctx = cav.getContext('2d')!
	const offCtx = offCav.getContext('2d')!

	const renderBuffers: ImageData[] = []
	const canRender = true

	registerFont('', { family: 'cas' })

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

const createImage = async (imageData: ImageData): Promise<Image> =>
	new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = reject
		img.src = Buffer.from(imageData.data)
	})

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
	await draw()
	await render()
}
