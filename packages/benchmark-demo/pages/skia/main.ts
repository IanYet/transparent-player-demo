import InitCanvasKit from 'canvaskit-wasm' // default

async function main() {
	const CanvasKit = await InitCanvasKit()
	const canvasElement = document.getElementById('canvas') as HTMLCanvasElement
	const surface = CanvasKit.MakeWebGLCanvasSurface(canvasElement)
	const skCanvas = surface?.getCanvas()!

	const paint = new CanvasKit.Paint()
	paint.setColor(CanvasKit.Color4f(0, 0, 0, 1))
	paint.setAntiAlias(true)

	const fontData = await (await fetch('/CascadiaCodePL.ttf')).arrayBuffer()

	const casTypeface = CanvasKit.Typeface.MakeFreeTypeFaceFromData(fontData)
	const font = new CanvasKit.Font(casTypeface, 24)
	font.setEdging(CanvasKit.FontEdging.SubpixelAntiAlias)
	font.setHinting(CanvasKit.FontHinting.Normal)

	skCanvas.drawText('Hello CanvasKit !==', 50, 50, paint, font)
	surface?.flush()
}

await main()
