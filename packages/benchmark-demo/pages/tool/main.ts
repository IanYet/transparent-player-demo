import * as bodySegmentation from '@tensorflow-models/body-segmentation'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import '@mediapipe/selfie_segmentation'

const [width, height] = [256, 512]
async function main() {
	const videoEl = document.getElementById('video') as HTMLVideoElement
	const appEl = document.getElementById('app')!
	const btn = document.getElementById('start')! as HTMLButtonElement
	const fww = new Worker('/fw.js')

	const canvasEl = document.createElement('canvas')
	canvasEl.width = width
	canvasEl.height = height
	appEl.appendChild(canvasEl)
	const ctx = canvasEl.getContext('2d')!

	const offCavEl = new OffscreenCanvas(width, height)
	const offCtx = offCavEl.getContext('2d')!

	let drawFlag = false

	videoEl.onplay = () => {
		console.log('play')
		drawFlag = true
	}

	videoEl.onpause = () => {
		console.log('pause')
		drawFlag = false

		fww.postMessage({
			type: 2,
		})
	}

	btn.onclick = async () => {
		const newHandle = await window.showSaveFilePicker({ suggestedName: 'data.bin' })
		fww.postMessage({
			type: 1,
			payload: newHandle,
		})
	}

	const segmenter = await bodySegmentation.createSegmenter(
		bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
		{ runtime: 'tfjs' }
	)

	let time = -1

	async function render() {
		time++
		requestAnimationFrame(render)
		offCtx?.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height)

		if (!(time % 4) && drawFlag) {
			const data = ctx.getImageData(0, 0, width, height)
			fww.postMessage(data.data.buffer)
		}

		if (!(time % 2)) {
			const segmentation = await segmenter.segmentPeople(offCavEl.transferToImageBitmap())

			const foregroundColor = { r: 0, g: 0, b: 0, a: 0 }
			const backgroundColor = { r: 0, g: 0, b: 0, a: 255 }

			const mask = await bodySegmentation.toBinaryMask(
				segmentation,
				foregroundColor,
				backgroundColor
			)
			await bodySegmentation.drawMask(canvasEl, canvasEl, mask, 1, 0)
		}
	}
	render()
}

main()
