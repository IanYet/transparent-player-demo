import { createCanvas, createImageData, ImageData } from 'canvas'
import * as fs from 'fs/promises'
import { createWriteStream } from 'fs'

const [width, height] = [256, 512]
const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')

const rawData = await fs.readFile(
	'/Users/ian/Projects/Personal/transparent-player-demo/packages/benchmark-demo/public/maybe.bin'
)
const rawArr = new Uint16Array(rawData.buffer)
console.log(rawArr)

let frameStart = 0,
	frameEnd = 0

const start = 0
const end = start + width * height

for (let i = 0, pixelNum = 0; i < rawArr.length; i++) {
	if (pixelNum === start) {
		frameStart = i
	}
	if (pixelNum === end) {
		frameEnd = i
		break
	}
	pixelNum = pixelNum + rawArr[i]
}

console.log(frameStart, frameEnd)

const frameRawArr = rawArr.slice(frameStart, frameEnd)
const frameImageData = createImageData(width, height)

console.log(frameRawArr.reduce((a, b) => a + b, 0))

function writeImage(imageData: ImageData, start: number, length: number, value: number) {
	for (let i = 0; i < length; i++) {
		const ii = (start + i) * 4
		imageData.data[ii + 0] = 0
		imageData.data[ii + 1] = 0
		imageData.data[ii + 2] = 0
		imageData.data[ii + 3] = value ? 0 : 255
	}
}

let arrStart = 0
let alpha = 0
frameRawArr.forEach((raw) => {
	writeImage(frameImageData, arrStart, raw, alpha)
	arrStart += raw
	alpha = (alpha + 1) % 2
})
console.log(arrStart)
ctx.putImageData(frameImageData, 0, 0)

const os = createWriteStream('res.png')
const stream = canvas.createPNGStream()
stream.pipe(os)
os.on('finish', () => console.log('saved'))
