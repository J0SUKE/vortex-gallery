import * as THREE from "three"

import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
import { VertexNormalsHelper } from "three/addons/helpers/VertexNormalsHelper.js"

interface Props {
  scene: THREE.Scene
}

export default class Gallery {
  scene: THREE.Scene

  constructor({ scene }: Props) {
    this.scene = scene

    this.createInstancedMesh()
    //this.createDebugMesh()
  }

  createInstancedMesh() {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const instancedMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    })

    const RADIUS = 5
    const HEIGHT = 30
    const COUNT = 200
    const PLANESCOUNTPERCIRCLE = 20

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      instancedMaterial,
      COUNT
    )

    // Custom buffers for per-instance attributes
    const cylinderPositionArray = new Float32Array(COUNT * 3)

    // Populate instance attributes
    const matrix = new THREE.Matrix4()

    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2
      //j = (i / COUNT) * -HEIGHT/2

      // Cylindrical coordinate conversion
      cylinderPositionArray[i * 3] = Math.cos(angle) * RADIUS
      cylinderPositionArray[i * 3 + 1] = Math.sin(angle) * RADIUS
      cylinderPositionArray[i * 3 + 2] = (Math.random() - 0.5) * HEIGHT

      //   const quaternion = new THREE.Quaternion()
      //   quaternion.setFromAxisAngle(
      //     new THREE.Vector3(0, 0, 1),
      //     (3 * Math.PI) / 2 + angle
      //   )

      //   const internalRotation = new THREE.Quaternion()
      //   internalRotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)
      //   quaternion.multiply(internalRotation)

      //   matrix.compose(
      //     new THREE.Vector3(
      //       cylinderPositionArray[i * 3],
      //       cylinderPositionArray[i * 3 + 1],
      //       cylinderPositionArray[i * 3 + 2]
      //     ),
      //     quaternion,
      //     new THREE.Vector3(1, 1, 1)
      //   )

      //   instancedMesh.setMatrixAt(i, matrix)
    }

    // Add custom attributes to geometry
    instancedMesh.geometry.setAttribute(
      "aInstancePosition",
      new THREE.InstancedBufferAttribute(cylinderPositionArray, 3)
    )

    this.scene.add(instancedMesh)
  }

  createDebugMesh() {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)

    const angle = Math.PI / 4

    mesh.position.x = Math.cos(angle) * Math.sqrt(2)
    mesh.position.y = Math.sin(angle) * Math.sqrt(2)
    mesh.position.z = 0

    // Assume initial plane normal is (0,0,1)
    const initialNormal = new THREE.Vector3(0, 0, 1)
    const targetNormal = new THREE.Vector3(
      -mesh.position.x,
      -mesh.position.y,
      0
    ).normalize()

    // Create a quaternion to rotate from initial to target normal
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      initialNormal,
      targetNormal
    )

    // Apply the rotation to your plane
    mesh.quaternion.copy(quaternion)

    const helper = new VertexNormalsHelper(mesh, 1, 0xffffff)

    this.scene.add(mesh)
    this.scene.add(helper)
  }
}
