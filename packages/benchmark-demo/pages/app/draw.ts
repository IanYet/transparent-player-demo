import { mat3, vec2, vec3, vec4 } from 'gl-matrix'
import { context } from './main'

export async function draw() {
	const { offCav, offCtx, renderBuffers } = context
	offCtx.clearRect(0, 0, offCav.width, offCav.height)

	const casFont = new FontFace('cas', 'url(/CascadiaCodePL.ttf)')
	const font = await casFont.load()
	document.fonts.add(font)

	offCtx.fillStyle = 'red'
	offCtx.font = '30px cas'
	offCtx.fillText('const :: |> <| => != >= <=', 0, 30)

	const image = offCtx.getImageData(0, 0, offCav.width, offCav.height)
	const res = process(image)

	renderBuffers.push(res)
	offCtx.clearRect(0, 0, offCav.width, offCav.height)

	context.renderEnabled = true
}

function process(srcImageData: ImageData) {
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
				srcImageData.height
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

/**
 * w&h for normalize
 * @param tarV
 * @param tw
 * @param th
 * @param sW
 * @param sH
 * @returns
 */
function perspectiveCpuShader(tarV: vec2, tw: number, th: number, sW: number, sH: number) {
	const perspectiveMaitrix = mat3.transpose(
		mat3.create(),
		mat3.fromValues(0.4, 0, 0.2, -0.2, 0.6, 0.2, -0.4, 0, 1)
	)
	const invert = mat3.create()
	mat3.invert(invert, perspectiveMaitrix)
	const iptV = vec3.fromValues(tarV[0] / (tw - 1), tarV[1] / (th - 1), 1)
	const optV = vec3.create()

	vec3.transformMat3(optV, iptV, invert)

	return vec2.fromValues(((sW - 1) * optV[0]) / optV[2], ((sH - 1) * optV[1]) / optV[2])
}
