import { mat3, vec2, vec3, vec4 } from 'gl-matrix'
import { context } from './main'

export async function draw() {
	const { offCav, offCtx, renderBuffers } = context
	const frameData = await readClipData(0)

	offCtx.clearRect(0, 0, offCav.width, offCav.height)

	offCtx.fillStyle = '#ffffff'
	// offCtx.fillRect(0, 0, offCav.width, offCav.height)
	offCtx.font = '30px cas'
	offCtx.textBaseline = 'top'
	offCtx.fillText('Do not go gentle into ', 10, 10)
	offCtx.fillText('that good night,', 10, 110)
	offCtx.fillText('Old age should burn and rave', 10, 410)
	offCtx.fillText('at close of day;', 10, 510)
	offCtx.fillText('Rage, rage', 10, 810)
	offCtx.fillText('against the dying of the light.', 10, 910)

	const image = offCtx.getImageData(0, 0, offCav.width, offCav.height)
	console.time('perspective process')
	const perspectiveRes = processPerspective2(image)
	console.timeEnd('perspective process')

	console.time('clip process')
	const clipRes = processClip(perspectiveRes, frameData)
	console.timeEnd('clip process')

	renderBuffers.push(clipRes)
	context.renderEnabled = true

	offCtx.clearRect(0, 0, offCav.width, offCav.height)
}

const isInbound = (u: number, v: number, w: number, h: number) => u >= 0 && u < w && v >= 0 && v < h

const getColor = (u: number, v: number, imageData: ImageData) =>
	isInbound(u, v, imageData.width, imageData.height)
		? vec4.fromValues(
				...(Array.from(
					imageData.data.slice(
						v * imageData.width * 4 + u * 4,
						v * imageData.width * 4 + u * 4 + 4
					)
				) as [number, number, number, number])
		  )
		: vec4.create()

const setColor = (u: number, v: number, imageData: ImageData, color: vec4) => {
	if (!isInbound(u, v, imageData.width, imageData.height)) return

	const i = v * imageData.width * 4 + u * 4
	imageData.data[i + 0] = color[0]
	imageData.data[i + 1] = color[1]
	imageData.data[i + 2] = color[2]
	imageData.data[i + 3] = color[3]
}

//@ts-ignore
function processPerspective(srcImageData: ImageData) {
	const { offCtx } = context
	const tarImageData = offCtx.createImageData(srcImageData)

	for (let v = 0; v < srcImageData.height; v++) {
		for (let u = 0; u < srcImageData.width; u++) {
			const srcV = vec2.fromValues(u, v)
			const srcC = getColor(u, v, srcImageData)

			if (srcC[3] === 0) continue

			const [du, dv] = perspectiveCpuShader(
				srcV,
				srcImageData.width,
				srcImageData.height,
				tarImageData.width,
				tarImageData.height
			)

			const [p0, p1, p2, p3] = [
				vec2.fromValues(Math.floor(du), Math.floor(dv)),
				vec2.fromValues(Math.floor(du) + 1, Math.floor(dv)),
				vec2.fromValues(Math.floor(du), Math.floor(dv) + 1),
				vec2.fromValues(Math.floor(du) + 1, Math.floor(dv) + 1),
			]
			const [c0, c1, c2, c3] = [p0, p1, p2, p3].map((p) => getColor(p[0], p[1], tarImageData))
			const [rightU, rightV] = [du - p0[0], dv - p0[1]]
			const [cp0, cp1, cp2, cp3] = [
				vec4.scaleAndAdd(vec4.create(), c0, srcC, (1 - rightU) * (1 - rightV)),
				vec4.scaleAndAdd(vec4.create(), c1, srcC, rightU * (1 - rightV)),
				vec4.scaleAndAdd(vec4.create(), c2, srcC, (1 - rightU) * rightV),
				vec4.scaleAndAdd(vec4.create(), c3, srcC, rightU * rightV),
			]

			;(
				[
					[p0, cp0],
					[p1, cp1],
					[p2, cp2],
					[p3, cp3],
				] as [vec2, vec4][]
			).forEach(([p, cp]) => {
				setColor(p[0], p[1], tarImageData, cp)
			})
		}
	}

	return tarImageData
}

function processPerspective2(srcImageData: ImageData) {
	const { offCtx } = context
	const tarImageData = offCtx.createImageData(srcImageData)
	for (let v = 0; v < tarImageData.height; v++) {
		for (let u = 0; u < tarImageData.width; u++) {
			const tarV = vec2.fromValues(u, v)
			const [su, sv] = perspectiveCpuShader(
				tarV,
				tarImageData.width,
				tarImageData.height,
				srcImageData.width,
				srcImageData.height,
				true
			)
			const [y, x] = [Math.floor(sv), Math.floor(su)]
			const isValid = (a: number, b: number) =>
				a >= 0 && a < srcImageData.width && b >= 0 && b < srcImageData.height
			const [ac, bc, cc, dc] = [
				isValid(x, y) ? y * srcImageData.width + x : -4,
				isValid(x + 1, y) ? y * srcImageData.width + x + 1 : -4,
				isValid(x, y + 1) ? (y + 1) * srcImageData.width + x : -4,
				isValid(x + 1, y + 1) ? (y + 1) * srcImageData.width + x + 1 : -4,
			].map((ii) =>
				vec4.fromValues(
					srcImageData.data[ii * 4 + 0] ?? 0,
					srcImageData.data[ii * 4 + 1] ?? 0,
					srcImageData.data[ii * 4 + 2] ?? 0,
					srcImageData.data[ii * 4 + 3] ?? 0
				)
			)
			const [rightY, rightX] = [sv - y, su - x]
			const color = vec4.lerp(
				vec4.create(),
				vec4.lerp(vec4.create(), ac, bc, rightX),
				vec4.lerp(vec4.create(), cc, dc, rightX),
				rightY
			)
			const clampedColor = new Uint8ClampedArray(color)
			const tarI = (v * tarImageData.width + u) * 4
			tarImageData.data[tarI + 0] = clampedColor[0]
			tarImageData.data[tarI + 1] = clampedColor[1]
			tarImageData.data[tarI + 2] = clampedColor[2]
			tarImageData.data[tarI + 3] = clampedColor[3]
		}
	}
	return tarImageData
}

function writeBytes(arr: Uint8Array, start: number, length: number, value: 0 | 1) {
	for (let i = 0; i < length; i++) {
		arr[start + i] = value
	}
}

/**
 *
 * @param frameNum 0-based
 */
async function readClipData(frameNum: number) {
	const res = await fetch('/maybe.bin')
	const allClipData = new Uint16Array(await res.arrayBuffer())
	const [clipWidth, clipHeight] = [256, 512]
	const start = clipWidth * clipHeight * frameNum
	const end = start + clipWidth * clipHeight
	let frameStart = 0,
		frameEnd = 0

	const frameAlphaData = new Uint8Array(clipWidth * clipHeight)

	for (let i = 0, pixelNum = 0; i < allClipData.length; i++) {
		if (pixelNum === start) {
			frameStart = i
		}
		if (pixelNum === end) {
			frameEnd = i
			break
		}
		pixelNum = pixelNum + allClipData[i]
	}
	const clipData = allClipData.slice(frameStart, frameEnd)

	let sig: 0 | 1 = 0
	let resStart = 0

	clipData.forEach((num) => {
		writeBytes(frameAlphaData, resStart, num, sig)
		sig = ((sig + 1) % 2) as 0 | 1
		resStart += num
	})

	return frameAlphaData
}

function processClip(imageData: ImageData, clipImageData: Uint8Array) {
	const { offCtx } = context
	const tarImageData = offCtx.createImageData(imageData)
	const [stepX, stepY] = [imageData.width / 256, imageData.height / 512]

	console.log(stepX, stepY)

	for (let i = 0; i < tarImageData.height; i++) {
		for (let j = 0; j < tarImageData.width; j++) {
			const [u, v] = [Math.floor(j / stepX), Math.floor(i / stepY)]
			const color = getColor(j, i, imageData)
			color[3] = clipImageData[v * 256 + u] ? 0 : color[3]
			setColor(j, i, tarImageData, color)
		}
	}

	return tarImageData
}

const perspectiveMaitrix = mat3.transpose(
	mat3.create(),
	mat3.fromValues(0.4, 0, 0.2, -0.2, 0.6, 0.2, -0.4, 0, 1)
)
const perspectiveMaitrixInvert = mat3.invert(mat3.create(), perspectiveMaitrix)
/**
 * w&h for normalize
 * @param iptV2
 * @param iw
 * @param ih
 * @param ow
 * @param oh
 * @returns
 */
function perspectiveCpuShader(
	iptV2: vec2,
	iw: number,
	ih: number,
	ow: number,
	oh: number,
	needInvert?: boolean
) {
	const mat = needInvert ? perspectiveMaitrixInvert : perspectiveMaitrix

	const iptV = vec3.fromValues(iptV2[0] / (iw - 1), iptV2[1] / (ih - 1), 1)
	const optV = vec3.create()

	vec3.transformMat3(optV, iptV, mat)

	return vec2.fromValues(((ow - 1) * optV[0]) / optV[2], ((oh - 1) * optV[1]) / optV[2])
}
