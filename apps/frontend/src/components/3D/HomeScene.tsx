
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useRoomControls } from "@/src/context/RoomControlsContext";
import { backgroundColors } from "./scene/config";

export default function HomeScene() {
  const ref = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<THREE.Color | null>(null);
  const { nightMode } = useRoomControls();

  useEffect(() => {
    const container = ref.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("white");
    backgroundRef.current = scene.background;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 3));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 6;

    const model = new THREE.Group();
    scene.add(model);

    let disposed = false;

    new GLTFLoader().load("/assets/Kewan.glb", ({ scene: object }) => {
      if (disposed) return;

      const box = new THREE.Box3().setFromObject(object);
      const sphere = box.getBoundingSphere(new THREE.Sphere());

      object.scale.setScalar(1 / sphere.radius);
      object.position.copy(sphere.center).multiplyScalar(-1 / sphere.radius);

      model.add(object);
    });

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      model.rotation.y += clock.getDelta() * 0.35;
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      backgroundRef.current = null;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    backgroundRef.current?.set(nightMode ? backgroundColors.night : 0xffffff);
  }, [nightMode]);

  return <div ref={ref} className="three-scene" />;
}
