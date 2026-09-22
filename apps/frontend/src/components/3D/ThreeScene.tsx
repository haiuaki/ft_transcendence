"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const positions = [
  { x: 0, y: 10, z: 0 },
  { x: 40, y: 10, z: 0 },
  { x: 80, y: 10, z: 0 },
  { x: 120, y: 10, z: 0 },
  { x: 0, y: 10, z: 40 },
  { x: 40, y: 10, z: 40 },
  { x: 80, y: 10, z: 40 },
  { x: 120, y: 10, z: 40 },
  { x: 0, y: 10, z: 80 },
  { x: 40, y: 10, z: 80 },
  { x: 80, y: 10, z: 80 },
  { x: 120, y: 10, z: 80 },
  { x: 0, y: 10, z: 120 },
  { x: 40, y: 10, z: 120 },
  { x: 80, y: 10, z: 120 },
  { x: 120, y: 10, z: 120 },
];

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      10000,
    );
    camera.position.set(1500, 1500, 1500);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1000;
    controls.maxDistance = 2000;
    controls.minPolarAngle = THREE.MathUtils.degToRad(0);
    controls.maxPolarAngle = THREE.MathUtils.degToRad(99);
    controls.minAzimuthAngle = THREE.MathUtils.degToRad(-10);
    controls.maxAzimuthAngle = THREE.MathUtils.degToRad(98);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    const loader = new GLTFLoader();
    loader.load(
      "/assets/room.glb",
      (gltf) => {
        scene.add(gltf.scene);
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        controls.target.copy(bounds.getCenter(new THREE.Vector3()));
        controls.update();
      },
      undefined,
      (error) => console.error("Erreur avec le modèle de la pièce :", error),
    );

    loader.load(
      "/assets/cube.glb",
      (gltf) => {
        positions.forEach(({ x, y, z }) => {
          const cube = gltf.scene.clone();
          cube.position.set(x, y, z);
          cube.scale.set(10, 10, 10);
          scene.add(cube);
        });
      },
      undefined,
      (error) => console.error("Erreur avec le modèle des cubes :", error),
    );

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const animationFrame = () => {
      controls.update();
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animationFrame);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.setAnimationLoop(null);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="three-scene" />;
}