import * as THREE from "three"

import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"

import centervertex from "./shaders/center-vertex.glsl"
import centerfragment from "./shaders/center-fragment.glsl"

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
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh
  imageInfos: ImageInfo[] = []
  atlasTexture: THREE.Texture | null = null
  scrollY: {
    speedTarget: number
    speedCurrent: number
    target: number
    current: number
    direction: number
  }
  cameraZ: number
  isScrolling: boolean
  textureIndex: number = 0

  constructor({ scene, cameraZ }: Props) {
    this.scene = scene
    this.scrollY = {
      speedTarget: 0,
      speedCurrent: 0,
      target: 0,
      current: 0,
      direction: 1,
    }
    this.cameraZ = cameraZ

    this.loadTextureAtlas().then(() => {
      this.createInstancedMesh()
      this.createCenteredMesh()
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
      "/frames/512/p12.jpg",
      "/frames/512/p13.jpg",
      "/frames/512/14.jpg",
      "/frames/512/15.jpg",
      "/frames/512/16.jpg",
      "/frames/512/17.jpg",
      "/frames/512/18.jpg",
      "/frames/512/19.jpg",
      "/frames/512/20.jpg",
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

    const RADIUS = 6
    const HEIGHT = 120
    const COUNT = 600

    //40 circles

    const TOTAL = COUNT

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
        uZrange: new THREE.Uniform(HEIGHT),
        uMaxZ: new THREE.Uniform(HEIGHT * 0.5),
        uSpeedY: new THREE.Uniform(0),
        uDirection: new THREE.Uniform(this.scrollY.direction),
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
    const aSpeeds = new Float32Array(TOTAL)
    const aImagesRes = new Float32Array(TOTAL * 2)
    const aTextureCoords = new Float32Array(TOTAL * 4)

    const CIRCLE_COUNT = HEIGHT / 3 // Number of circles in the cylinder
    const CIRCLE_HEIGHT = HEIGHT / CIRCLE_COUNT

    const speeds = new Float32Array(CIRCLE_COUNT)

    for (let j = 0; j < CIRCLE_COUNT; j++) {
      speeds[j] = Math.random() * 0.2 + 0.8
    }

    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2
      const imageIndex = Math.floor(Math.random() * this.imageInfos.length) // Randomly select an image index

      aTextureCoords[i * 4 + 0] = this.imageInfos[imageIndex].uvs.xStart
      aTextureCoords[i * 4 + 1] = this.imageInfos[imageIndex].uvs.xEnd
      aTextureCoords[i * 4 + 2] = this.imageInfos[imageIndex].uvs.yStart
      aTextureCoords[i * 4 + 3] = this.imageInfos[imageIndex].uvs.yEnd

      aImagesRes[i * 2 + 0] = this.imageInfos[imageIndex].width
      aImagesRes[i * 2 + 1] = this.imageInfos[imageIndex].height

      aAngles[i] = angle
      aHeights[i] = (i % CIRCLE_COUNT) * CIRCLE_HEIGHT - HEIGHT / 2
      aRadiuses[i] = RADIUS

      aAspectRatios[i] = this.imageInfos[imageIndex].aspectRatio
      aSpeeds[i] = speeds[i % CIRCLE_COUNT]
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

  updateScroll(scrollY: number, direction: number) {
    this.scrollY.direction = direction

    this.scrollY.speedTarget += scrollY

    this.scrollY.target += scrollY
  }

  createCenteredMesh() {
    const geometry = new THREE.PlaneGeometry(1.7, 2.3)
    this.material = new THREE.ShaderMaterial({
      vertexShader: centervertex,
      fragmentShader: centerfragment,
      uniforms: {
        uAtlas: new THREE.Uniform(this.atlasTexture),
        uTextureCoords: new THREE.Uniform(
          new THREE.Vector4(
            this.imageInfos[this.textureIndex].uvs.xStart,
            this.imageInfos[this.textureIndex].uvs.xEnd,
            this.imageInfos[this.textureIndex].uvs.yStart,
            this.imageInfos[this.textureIndex].uvs.yEnd
          )
        ),
      },
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)
  }

  render(time: number) {
    if (this.instancedMaterial && this.material) {
      this.instancedMaterial.uniforms.uTime.value = time
      this.scrollY.target += 0.015 * this.scrollY.direction
      this.scrollY.speedTarget += 0.015 * this.scrollY.direction

      this.textureIndex = Math.abs(
        Math.floor(this.scrollY.speedTarget % (this.imageInfos.length - 1))
      )

      this.material.uniforms.uTextureCoords.value.set(
        this.imageInfos[this.textureIndex].uvs.xStart,
        this.imageInfos[this.textureIndex].uvs.xEnd,
        this.imageInfos[this.textureIndex].uvs.yStart,
        this.imageInfos[this.textureIndex].uvs.yEnd
      )

      this.isScrolling = false

      //this.speed *= 0.9

      this.scrollY.current = gsap.utils.interpolate(
        this.scrollY.current,
        this.scrollY.target,
        0.1
      )

      this.scrollY.speedCurrent = gsap.utils.interpolate(
        this.scrollY.speedCurrent,
        this.scrollY.speedTarget,
        0.1
      )

      this.instancedMaterial.uniforms.uScrollY.value = this.scrollY.current

      this.instancedMaterial.uniforms.uSpeedY.value = this.scrollY.speedCurrent
      this.instancedMaterial.uniforms.uDirection.value = this.scrollY.direction
    }
  }
}
