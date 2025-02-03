import * as THREE from "three"

import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"

import debugvertex from "./shaders/debug/vertex.glsl"
import debugfragment from "./shaders/debug/fragment.glsl"

import { VertexNormalsHelper } from "three/addons/helpers/VertexNormalsHelper.js"
import gsap from "gsap"

interface Props {
  scene: THREE.Scene
  cameraZ: number
}

interface ImageInfo {
  width: number
  height: number
  aspectRatio: number
  uvs: {
    xStart: number
    xEnd: number
    yStart: number
    yEnd: number
  }
}

export default class Gallery {
  scene: THREE.Scene
  instancedMaterial: THREE.ShaderMaterial
  imageInfos: ImageInfo[] = []
  atlasTexture: THREE.Texture | null = null
  scrollY: {
    target: number
    current: number
    direction: number
  }
  cameraZ: number
  isScrolling: boolean

  constructor({ scene, cameraZ }: Props) {
    this.scene = scene
    this.scrollY = {
      target: 0,
      current: 0,
      direction: -1,
    }
    this.cameraZ = cameraZ

    this.loadTextureAtlas().then(() => {
      this.createInstancedMesh()
    })
    //this.createDebugMesh()
  }

  async loadTextureAtlas() {
    // Define your image paths
    const imagePaths = [
      "/frames/512/p1.jpg",
      "/frames/512/p2.jpg",
      "/frames/512/p3.jpg",
      "/frames/512/p4.jpg",
      "/frames/512/p5.jpg",
      "/frames/512/p6.jpg",
      "/frames/512/p7.jpg",
      "/frames/512/p8.jpg",
      "/frames/512/p9.jpg",
      "/frames/512/p10.jpg",
      "/frames/512/p11.jpg",
    ]

    // Load all images first to get their dimensions
    const imagePromises = imagePaths.map((path) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = path
      })
    })

    const images = await Promise.all(imagePromises)

    // Calculate atlas dimensions (for simplicity, we'll stack images vertically)
    const atlasWidth = Math.max(...images.map((img) => img.width))
    let totalHeight = 0

    // First pass: calculate total height
    images.forEach((img) => {
      totalHeight += img.height
    })

    // Create canvas with calculated dimensions
    const canvas = document.createElement("canvas")
    canvas.width = atlasWidth
    canvas.height = totalHeight
    const ctx = canvas.getContext("2d")!

    // Second pass: draw images and calculate normalized coordinates
    let currentY = 0
    this.imageInfos = images.map((img) => {
      const aspectRatio = img.width / img.height

      // Draw the image
      ctx.drawImage(img, 0, currentY)

      // Calculate normalized coordinates

      const info = {
        width: img.width,
        height: img.height,
        aspectRatio,
        uvs: {
          xStart: 0,
          xEnd: img.width / atlasWidth,
          yStart: 1 - currentY / totalHeight,
          yEnd: 1 - (currentY + img.height) / totalHeight,
        },
      }

      currentY += img.height
      return info
    })

    // Create texture from canvas
    this.atlasTexture = new THREE.Texture(canvas)
    this.atlasTexture.needsUpdate = true
  }

  createInstancedMesh() {
    //const geometry = new THREE.PlaneGeometry(1.7, 1.7)
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 0.075)

    const RADIUS = 4
    const HEIGHT = 120
    const COUNT = 600
    const BGCOUNT = 6000

    const TOTAL = COUNT + BGCOUNT

    this.instancedMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      //side: THREE.DoubleSide,
      precision: "highp",
      transparent: true,
      //blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uAtlas: new THREE.Uniform(this.atlasTexture),
        uScrollY: new THREE.Uniform(this.scrollY),
        uMaxZ: new THREE.Uniform(this.cameraZ),
        uZrange: new THREE.Uniform(HEIGHT),
      },
    })

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      this.instancedMaterial,
      TOTAL
    )

    // Custom buffers for per-instance attributes
    const aAngles = new Float32Array(TOTAL)
    const aHeights = new Float32Array(TOTAL)
    const aRadiuses = new Float32Array(TOTAL)
    const aAspectRatios = new Float32Array(TOTAL)
    const aAlphas = new Float32Array(TOTAL)
    const aSpeeds = new Float32Array(TOTAL)
    const aImagesRes = new Float32Array(TOTAL * 2)
    const aTextureCoords = new Float32Array(TOTAL * 4)

    const CIRCLE_COUNT = HEIGHT / 3 // Number of circles in the cylinder
    const CIRCLE_HEIGHT = HEIGHT / CIRCLE_COUNT

    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2
      const imageIndex = Math.floor(Math.random() * this.imageInfos.length)

      aTextureCoords[i * 4 + 0] = this.imageInfos[imageIndex].uvs.xStart
      aTextureCoords[i * 4 + 1] = this.imageInfos[imageIndex].uvs.xEnd
      aTextureCoords[i * 4 + 2] = this.imageInfos[imageIndex].uvs.yStart
      aTextureCoords[i * 4 + 3] = this.imageInfos[imageIndex].uvs.yEnd

      aImagesRes[i * 2 + 0] = this.imageInfos[imageIndex].width
      aImagesRes[i * 2 + 1] = this.imageInfos[imageIndex].height

      aAngles[i] = angle
      aHeights[i] = (i % CIRCLE_COUNT) * CIRCLE_HEIGHT - HEIGHT / 2
      aRadiuses[i] = Math.random() * 10 + RADIUS

      aAspectRatios[i] = this.imageInfos[imageIndex].aspectRatio
      aAlphas[i] = 1
      aSpeeds[i] = 0.2
    }

    const MIN_RADIUS = RADIUS + 12
    const MAX_RADIUS = MIN_RADIUS + 50

    for (let i = COUNT; i < COUNT + BGCOUNT; i++) {
      const angle = ((i - COUNT) / BGCOUNT) * Math.PI * 2
      const imageIndex = Math.floor(
        Math.random() * (this.imageInfos.length - 1)
      )

      aTextureCoords[i * 4 + 0] = this.imageInfos[imageIndex].uvs.xStart
      aTextureCoords[i * 4 + 1] = this.imageInfos[imageIndex].uvs.xEnd
      aTextureCoords[i * 4 + 2] = this.imageInfos[imageIndex].uvs.yStart
      aTextureCoords[i * 4 + 3] = this.imageInfos[imageIndex].uvs.yEnd

      aImagesRes[i * 2 + 0] = this.imageInfos[imageIndex].width
      aImagesRes[i * 2 + 1] = this.imageInfos[imageIndex].height

      aAngles[i] = angle
      aHeights[i] = (Math.random() - 0.5) * HEIGHT
      aRadiuses[i] = Math.random() * 50 + MIN_RADIUS

      aAspectRatios[i] = Math.random() * 0.7 + 0.5
      aAlphas[i] =
        (1 - (aRadiuses[i] - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 0.3

      aSpeeds[i] = (Math.random() - 0.5) * 0.1 + 0.1
    }

    // Add custom attributes to geometry

    instancedMesh.geometry.setAttribute(
      "aAngle",
      new THREE.InstancedBufferAttribute(aAngles, 1)
    )

    instancedMesh.geometry.setAttribute(
      "aHeight",
      new THREE.InstancedBufferAttribute(aHeights, 1)
    )

    instancedMesh.geometry.setAttribute(
      "aRadius",
      new THREE.InstancedBufferAttribute(aRadiuses, 1)
    )
    instancedMesh.geometry.setAttribute(
      "aAspectRatio",
      new THREE.InstancedBufferAttribute(aAspectRatios, 1)
    )
    instancedMesh.geometry.setAttribute(
      "aAlpha",
      new THREE.InstancedBufferAttribute(aAlphas, 1)
    )
    instancedMesh.geometry.setAttribute(
      "aSpeed",
      new THREE.InstancedBufferAttribute(aSpeeds, 1)
    )

    instancedMesh.geometry.setAttribute(
      "aTextureCoords",
      new THREE.InstancedBufferAttribute(aTextureCoords, 4)
    )

    instancedMesh.geometry.setAttribute(
      "aImageRes",
      new THREE.InstancedBufferAttribute(aImagesRes, 2)
    )

    this.scene.add(instancedMesh)
  }

  updateScroll(scrollY: number) {
    //this.scrollY.direction = Math.sign(scrollY - this.scrollY.target) || 1
    //console.log(this.scrollY.direction)
    // if (scrollY > this.scrollY.target) {
    //   this.scrollY.direction = -1
    // } else if (scrollY <= this.scrollY.target) {
    //   this.scrollY.direction = 1
    // }

    //console.log(scrollY)

    this.scrollY.target += scrollY
  }

  createDebugMesh() {
    const geometry = new THREE.BoxGeometry(20, 20, 1)
    const material = new THREE.ShaderMaterial({
      vertexShader: debugvertex,
      fragmentShader: debugfragment,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uTexture: new THREE.Uniform(new THREE.TextureLoader().load("/e1.jpg")),
      },
    })

    const mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)
  }

  render(time: number) {
    if (this.instancedMaterial) {
      this.instancedMaterial.uniforms.uTime.value = time
      this.scrollY.target += 0.1

      this.isScrolling = false

      this.scrollY.current = gsap.utils.interpolate(
        this.scrollY.current,
        this.scrollY.target,
        0.1
      )

      this.instancedMaterial.uniforms.uScrollY.value = this.scrollY.current
    }
  }
}
