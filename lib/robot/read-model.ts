"use client";

import * as THREE from "three";
import type { ModelReading } from "./analyze";

/** Browser-side read of a .glb/.obj/.stl: meshes, vertices, bones. Throws on unreadable files. */
export async function readModel(file: File): Promise<ModelReading> {
  const ext = file.name.toLowerCase().split(".").pop();
  const buffer = await file.arrayBuffer();
  if (ext === "stl") {
    const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
    const geometry = new STLLoader().parse(buffer);
    return { format: "stl", meshes: 1, vertices: geometry.attributes.position?.count ?? 0, bones: [] };
  }
  let root: THREE.Object3D;
  let format: ModelReading["format"];
  if (ext === "obj") {
    const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
    root = new OBJLoader().parse(new TextDecoder().decode(buffer));
    format = "obj";
  } else if (ext === "glb") {
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const gltf = await new GLTFLoader().parseAsync(buffer, "");
    root = gltf.scene;
    format = "glb";
  } else {
    throw new Error(`Unsupported format .${ext}`);
  }
  let meshes = 0;
  let vertices = 0;
  const bones: string[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.push(o.name);
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      meshes += 1;
      vertices += mesh.geometry.attributes.position?.count ?? 0;
    }
  });
  if (meshes === 0) throw new Error("No mesh found");
  return { format, meshes, vertices, bones };
}
