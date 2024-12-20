import { ImageData } from '@napi-rs/canvas'
import { mat3, vec2, vec3, vec4 } from 'gl-matrix'

export const isInbound = (u: number, v: number, w: number, h: number) =>
	u >= 0 && u < w && v >= 0 && v < h

export const getColor = (u: number, v: number, imageData: ImageData) => {
	const ii = v * imageData.width + u
	return isInbound(u, v, imageData.width, imageData.height)
		? vec4.fromValues(
				imageData.data[ii * 4 + 0],
				imageData.data[ii * 4 + 1],
				imageData.data[ii * 4 + 2],
				imageData.data[ii * 4 + 3]
		  )
		: vec4.create()
}

export const setColor = (u: number, v: number, imageData: ImageData, color: vec4) => {
	if (!isInbound(u, v, imageData.width, imageData.height)) return

	const i = v * imageData.width * 4 + u * 4
	imageData.data[i + 0] = color[0]
	imageData.data[i + 1] = color[1]
	imageData.data[i + 2] = color[2]
	imageData.data[i + 3] = color[3]
}

export function writeBytes(arr: Uint8Array, start: number, length: number, value: 0 | 1) {
	for (let i = 0; i < length; i++) {
		arr[start + i] = value
	}
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
export function perspectiveCpuShader(
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
