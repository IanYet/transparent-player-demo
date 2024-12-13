import {
	PerspectiveCamera,
	WebGLRenderer,
	Scene,
	Mesh,
	MOUSE,
	PlaneGeometry,
	ShaderMaterial,
	Color,
	Matrix3,
	TextureLoader,
	CanvasTexture,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new WebGLRenderer({ alpha: true, antialias: true })
const scene = new Scene()
const control = new OrbitControls(camera, renderer.domElement)
const stats = new Stats()

/**
 * global three context
 */
const glContext = {
	renderer,
	camera,
	scene,
	control,
	stats,
	loopId: 0,
}

const is = false
async function main() {
	const { renderer, camera, scene, control, stats } = glContext
	const el = document.getElementById('app')
	//@ts-ignore
	window['glContext'] = glContext

	if (!el) return

	el.style.background = 'linear-gradient(0deg ,#c1c2c3, #eeeeee)'

	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setClearAlpha(0)
	el.appendChild(renderer.domElement)

	camera.position.set(0, 0, 500)
	camera.updateProjectionMatrix()

	scene.add(camera)

	control.update()
	control.enabled = true
	control.enableZoom = false
	control.enableRotate = false
	control.mouseButtons.LEFT = MOUSE.PAN

	const cav = new OffscreenCanvas(512, 512)
	const ctx = cav.getContext('2d')!
	ctx.clearRect(0, 0, 512, 512)

	const casFont = new FontFace('cas', 'url(/CascadiaCodePL.ttf)')
	const font = await casFont.load()
	document.fonts.add(font)

	ctx.fillStyle = 'red'
	ctx.font = '30px cas'
	ctx.fillText('const :: |> <| => != >= <=', 0, 30)

	const tex = new CanvasTexture(cav)

	const mat0 = new ShaderMaterial({
		uniforms: {
			diffuse: {
				value: new Color(0xffffff),
			},
			opacity: {
				value: 1.0,
			},
			transform: {
				value: new Matrix3().set(0.4, 0, 0.2, -0.2, 0.6, 0.2, -0.4, 0, 1).invert(),
			},
			map: {
				value: null,
			},
		},
		vertexShader: `
            varying vec2 vUv;
            void main(){
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
		fragmentShader: `
            uniform mat3 transform;
            uniform vec3 diffuse;
            uniform float opacity;
            uniform sampler2D map;

            varying vec2 vUv;
            void main(){
                vec3 coord = transform * vec3(vUv, 1.0);
                vec4 texture = texture2D(map, coord.xy/coord.z);
                vec4 color = clamp(texture + vec4(diffuse, opacity), 0.0, 1.0);
                gl_FragColor = color;
            }
        `,
	})
	mat0.uniforms.diffuse.value.set(0x000000)

	const geo = new PlaneGeometry(512, 512)
	const texture = new TextureLoader().load(
		'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
		// '/water.jpg'
	)
	mat0.uniforms.map.value = is ? texture : tex
	const plane = new Mesh(geo, mat0)
	scene.add(plane)

	el.appendChild(stats.dom)

	window.addEventListener('resize', () => {
		renderer.setSize(window.innerWidth, window.innerHeight)
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
	})

	glContext.loopId = requestAnimationFrame(loop)
}

function loop(_: number) {
	const { renderer, camera, scene, stats } = glContext

	glContext.loopId = requestAnimationFrame(loop)

	renderer.render(scene, camera)
	stats.update()
}

main()
