import * as THREE from "three"
import { Dimensions, Size } from "./types/types"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import GUI from "lil-gui"

import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
import Gallery from "./gallery"
import normalizeWheel from "normalize-wheel"

export default class Canvas {
  element: HTMLCanvasElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  sizes: Size
  dimensions: Dimensions
  time: number
  clock: THREE.Clock
  raycaster: THREE.Raycaster
  mouse: THREE.Vector2
  orbitControls: OrbitControls
  debug: GUI
  gallery: Gallery
  scrollY: number
  lastDirection: number = 1

  constructor() {
    this.element = document.getElementById("webgl") as HTMLCanvasElement
    this.time = 0
    this.scrollY = 0
    this.createClock()
    this.createScene()
    this.createCamera()
    this.createRenderer()
    this.setSizes()
    this.createRayCaster()
    //this.createOrbitControls()
    this.addEventListeners()
    this.createDebug()
    this.createGallery()
    //this.createHelpers()
    this.render()
    this.debug.hide()
  }

  createScene() {
    this.scene = new THREE.Scene()
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    )
    this.scene.add(this.camera)
    this.camera.position.z = 5
  }

  createOrbitControls() {
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    )
  }

  createRenderer() {
    this.dimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(2, window.devicePixelRatio),
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.element,
      alpha: true,
    })
    this.renderer.setSize(this.dimensions.width, this.dimensions.height)
    this.renderer.render(this.scene, this.camera)

    this.renderer.setPixelRatio(this.dimensions.pixelRatio)
  }

  createDebug() {
    this.debug = new GUI()
  }

  setSizes() {
    let fov = this.camera.fov * (Math.PI / 180)
    let height = this.camera.position.z * Math.tan(fov / 2) * 2
    let width = height * this.camera.aspect

    this.sizes = {
      width: width,
      height: height,
    }
  }

  createClock() {
    this.clock = new THREE.Clock()
  }

  createRayCaster() {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
  }

  onMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)
    const target = intersects[0]
    if (target && "material" in target.object) {
      const targetMesh = intersects[0].object as THREE.Mesh
    }
  }

  addEventListeners() {
    window.addEventListener("mousemove", this.onMouseMove.bind(this))
    window.addEventListener("resize", this.onResize.bind(this))
    window.addEventListener("wheel", this.onWheel.bind(this))
  }

  onResize() {
    this.dimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(2, window.devicePixelRatio),
    }

    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.setSizes()

    this.renderer.setPixelRatio(this.dimensions.pixelRatio)
    this.renderer.setSize(this.dimensions.width, this.dimensions.height)
  }

  createGallery() {
    this.gallery = new Gallery({
      scene: this.scene,
      cameraZ: this.camera.position.z,
    })
  }

  createHelpers() {
    const axesHelper = new THREE.AxesHelper(1)
    this.scene.add(axesHelper)
  }

  onWheel(event: WheelEvent) {
    //console.log(event.deltaY)

    const normalizedWheel = normalizeWheel(event)

    const delta = event.deltaY
    let value = Math.sign(event.deltaY)

    if (delta === 0) {
      value = this.lastDirection
    } else {
      this.lastDirection = value
    }

    this.gallery.updateScroll(
      (normalizedWheel.pixelY * this.sizes.height) / window.innerHeight,
      this.lastDirection
    )
  }

  render() {
    this.time = this.clock.getElapsedTime()

    this.orbitControls?.update()
    this.gallery.render(this.time)

    this.renderer.render(this.scene, this.camera)
  }
}
