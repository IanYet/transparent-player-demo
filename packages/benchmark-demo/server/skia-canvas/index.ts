import { Canvas, CanvasRenderingContext2D, FontLibrary, ImageData } from 'skia-canvas'
import { draw } from '../skia-canvas/draw'

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
	const cav = new Canvas(540, 960)
	cav.gpu = false
	const offCav = new Canvas(540, 960)
	offCav.gpu = false
	const ctx = cav.getContext('2d')!
	const offCtx = offCav.getContext('2d')!

	const renderBuffers: ImageData[] = []
	const canRender = true

	FontLibrary.use('cas', `${base_public_url}CascadiaCodePL.ttf`)

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
	tempCanvas.gpu = false
	const tempCtx = tempCanvas.getContext('2d')
	tempCtx.putImageData(imageData, 0, 0)

	return tempCanvas
}

async function render() {
	// render or export
	const { ctx, renderBuffers, cav } = context
	ctx.clearRect(0, 0, cav.width, cav.height)

	const renderBitmaps = renderBuffers.map((buffer) => createImage(buffer))

	for await (const bitmap of renderBitmaps) {
		ctx.drawCanvas(bitmap, 0, 0, cav.width, cav.height)
	}
	// renderBuffers.length = 0

	await cav.saveAs(`skia-canvas.png`)

	// const os = createWriteStream('node-canvas.png')
	// const stream = cav.createPNGStream()
	// stream.pipe(os)
	// os.on('finish', () => console.log('saved'))
}
export async function main() {
	await draw()
	await render()
}
