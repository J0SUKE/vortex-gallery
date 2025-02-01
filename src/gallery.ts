import * as THREE from "three"

import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
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
  }
  cameraZ: number

  constructor({ scene, cameraZ }: Props) {
    this.scene = scene
    this.scrollY = {
      target: 0,
      current: 0,
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
      "/frames/f1.jpg",
      "/frames/f2.jpg",
      "/frames/f3.jpg",
      "/frames/f4.jpg",
      "/frames/f5.jpg",
      "/frames/f6.jpg",
      "/frames/f7.jpg",
      "/frames/f8.jpg",
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

    await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image()
      img.onload = () => {
        images.push(img)
        resolve(img)
      }
      img.src = "/black.png"
    })

    // Calculate atlas dimensions (for simplicity, we'll stack images vertically)
    let atlasHeight = 0
    const atlasWidth = Math.max(...images.map((img) => img.width))

    // First pass: calculate total height and store image info
    images.forEach((img) => {
      const aspectRatio = img.width / img.height

      this.imageInfos.push({
        width: img.width,
        height: img.height,
        aspectRatio,
        uvs: {
          xStart: 0,
          xEnd: img.width / atlasWidth,
          yStart: atlasHeight,
          yEnd: atlasHeight + img.height,
        },
      })

      atlasHeight += img.height
    })

    // Create canvas for the atlas
    const canvas = document.createElement("canvas")
    canvas.width = atlasWidth
    canvas.height = atlasHeight
    const ctx = canvas.getContext("2d")!

    // Draw images to canvas
    let currentY = 0
    images.forEach((img, index) => {
      ctx.drawImage(img, 0, currentY)

      // Update UVs with normalized coordinates
      this.imageInfos[index].uvs.yStart = currentY / atlasHeight
      this.imageInfos[index].uvs.yEnd = (currentY + img.height) / atlasHeight

      currentY += img.height
    })

    // Create texture from canvas
    this.atlasTexture = new THREE.Texture(canvas)
    this.atlasTexture.needsUpdate = true
  }

  createInstancedMesh() {
    const geometry = new THREE.PlaneGeometry(1.3, 1.3)

    const RADIUS = 4
    const HEIGHT = 120
    const COUNT = 600
    const BGCOUNT = 3000

    this.instancedMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      //transparent: true,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uAtlas: new THREE.Uniform(this.atlasTexture),
        uScrollY: new THREE.Uniform(this.scrollY),
        uMaxZ: new THREE.Uniform(this.cameraZ),
        uZrange: new THREE.Uniform(HEIGHT),
        uImageData: new THREE.Uniform(
          this.imageInfos
            .map((info) => [
              info.uvs.xStart,
              info.uvs.xEnd,
              info.uvs.yStart,
              info.uvs.yEnd,
              info.aspectRatio,
            ])
            .flat()
        ),
      },
    })

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      this.instancedMaterial,
      COUNT + BGCOUNT
    )

    // Custom buffers for per-instance attributes
    const aAngles = new Float32Array(COUNT + BGCOUNT)
    const aHeights = new Float32Array(COUNT + BGCOUNT)
    const aRadiuses = new Float32Array(COUNT + BGCOUNT)
    const aImageIndices = new Float32Array(COUNT + BGCOUNT)
    const aAspectRatios = new Float32Array(COUNT + BGCOUNT)
    const aAlphas = new Float32Array(COUNT + BGCOUNT)
    const aSpeeds = new Float32Array(COUNT + BGCOUNT)

    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2
      const imageIndex = Math.floor(
        Math.random() * (this.imageInfos.length - 1)
      )

      aAngles[i] = angle
      aHeights[i] = (Math.random() - 0.5) * HEIGHT
      aRadiuses[i] = Math.random() * 7 + RADIUS

      aImageIndices[i] = imageIndex
      aAspectRatios[i] = this.imageInfos[imageIndex].aspectRatio
      aAlphas[i] = 1
      aSpeeds[i] = 0.2
    }

    const MIN_RADIUS = RADIUS + 7
    const MAX_RADIUS = RADIUS + 37

    for (let i = COUNT; i < COUNT + BGCOUNT; i++) {
      const angle = ((i - COUNT) / BGCOUNT) * Math.PI * 2
      const imageIndex = this.imageInfos.length - 1

      aAngles[i] = angle
      aHeights[i] = (Math.random() - 0.5) * HEIGHT
      aRadiuses[i] = Math.random() * 30 + RADIUS + 7

      aImageIndices[i] = imageIndex
      aAlphas[i] =
        (1 - (aRadiuses[i] - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 0.6

      aSpeeds[i] = Math.random() * 0.1 + 0.1
    }

    // Add custom attributes to geometry
    instancedMesh.geometry.setAttribute(
      "aImageIndex",
      new THREE.InstancedBufferAttribute(aImageIndices, 1)
    )

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

    this.scene.add(instancedMesh)
  }

  updateScroll(scrollY: number) {
    this.scrollY.target = scrollY
  }

  render(time: number) {
    if (this.instancedMaterial) {
      this.instancedMaterial.uniforms.uTime.value = time

      this.scrollY.current = gsap.utils.interpolate(
        this.scrollY.current,
        this.scrollY.target,
        0.1
      )

      this.instancedMaterial.uniforms.uScrollY.value = this.scrollY.current
    }
  }
}
