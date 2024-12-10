import { mat4 } from 'gl-matrix'
import './style.css'

// Compile shader
function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type)!
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('Shader compile failed:', gl.getShaderInfoLog(shader))
		gl.deleteShader(shader)
		return null
	}
	return shader
}

function createTorusGeometry(
	radius: number,
	tube: number,
	radialSegments: number,
	tubularSegments: number
) {
	const vertices = []
	const texCoords = []
	const indices = []

	for (let j = 0; j <= radialSegments; j++) {
		const v = j / radialSegments
		const phi = v * Math.PI * 2

		for (let i = 0; i <= tubularSegments; i++) {
			const u = i / tubularSegments
			const theta = u * Math.PI * 2

			const x = (radius + tube * Math.cos(theta)) * Math.cos(phi)
			const y = (radius + tube * Math.cos(theta)) * Math.sin(phi)
			const z = tube * Math.sin(theta)

			vertices.push(x, y, z)
			texCoords.push(u, v)

			if (i < tubularSegments && j < radialSegments) {
				const a = i + j * (tubularSegments + 1)
				const b = i + (j + 1) * (tubularSegments + 1)
				const c = i + 1 + j * (tubularSegments + 1)
				const d = i + 1 + (j + 1) * (tubularSegments + 1)

				indices.push(a, b, c, b, d, c)
			}
		}
	}

	return {
		vertices: new Float32Array(vertices),
		texCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices),
	}
}
async function main() {
	const canvas = document.getElementById('canvas') as HTMLCanvasElement
	const gl = canvas.getContext('webgl')!

	if (!gl) {
		alert('WebGL not supported!')
		throw new Error('WebGL not supported')
	}

	const vsSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying vec2 vTexCoord;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
            vTexCoord = aTexCoord;
        }
    `

	const fsSource = `
        precision mediump float;

        uniform sampler2D uTexture;
        uniform float uOffset;

        varying vec2 vTexCoord;

        void main() {
            vec2 coord = vTexCoord;
            coord.t += uOffset; // Add offset for scrolling
            gl_FragColor = texture2D(uTexture, coord);
        }
    `

	const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource)
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)

	if (!fs || !vs) return

	const program = gl.createProgram()!
	gl.attachShader(program, vs)
	gl.attachShader(program, fs)
	gl.linkProgram(program)

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Program link failed:', gl.getProgramInfoLog(program))
		return
	}

	gl.useProgram(program)

	const torus = createTorusGeometry(2, 0.5, 32, 32)

	const positionBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, torus.vertices, gl.STATIC_DRAW)

	const texCoordBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, torus.texCoords, gl.STATIC_DRAW)

	const indexBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, torus.indices, gl.STATIC_DRAW)

	const aPosition = gl.getAttribLocation(program, 'aPosition')
	gl.enableVertexAttribArray(aPosition)
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
	gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)

	const aTexCoord = gl.getAttribLocation(program, 'aTexCoord')
	gl.enableVertexAttribArray(aTexCoord)
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
	gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0)

	const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix')
	const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix')
	const uTexture = gl.getUniformLocation(program, 'uTexture')
	const uOffset = gl.getUniformLocation(program, 'uOffset')

	// Create and configure texture
	const texture = gl.createTexture()
	const image = new Image()
	image.src = '/water.jpg' // Example texture
	image.onload = () => {
		gl.bindTexture(gl.TEXTURE_2D, texture)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
		gl.generateMipmap(gl.TEXTURE_2D)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
	}

	// Set up matrices
	const projectionMatrix = mat4.create()
	const modelViewMatrix = mat4.create()

	mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100)
	mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -8])

	// Animation variables
	let offset = 0

	// Render loop
	function render() {
		offset += 0.01

		// gl.clearColor(0, 0, 0, 1)
		// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix)
		gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix)
		gl.uniform1f(uOffset, offset)
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, texture)
		gl.uniform1i(uTexture, 0)

		gl.drawElements(gl.TRIANGLES, torus.indices.length, gl.UNSIGNED_SHORT, 0)

		requestAnimationFrame(render)
	}

	render()
}

main()
