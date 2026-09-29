"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // SCÈNE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // CAMÉRA
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      10000,
    );

    camera.position.set(250, 250, 250);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(renderer.domElement);

    // CONTRÔLES SOURIS
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;

    controls.minDistance = 100;
    controls.maxDistance = 500;

    controls.minPolarAngle = THREE.MathUtils.degToRad(0);
    controls.maxPolarAngle = THREE.MathUtils.degToRad(95);

    controls.minAzimuthAngle = THREE.MathUtils.degToRad(-3);
    controls.maxAzimuthAngle = THREE.MathUtils.degToRad(95);

    controls.enablePan = false;

    // LUMIÈRES
    const ambientLight = new THREE.AmbientLight(0x000000, 100);
    scene.add(ambientLight);

    // CHARGEMENT DU MODÈLE
    const loader = new GLTFLoader();

    let model: THREE.Group | null = null;

    loader.load(
      "/assets/cluster.glb",

      (gltf) => {
        model = gltf.scene;

        model.scale.set(1, 1, 1);
        model.rotation.y = Math.PI / 2;

        scene.add(model);

        // Cherche l'objet Blender nommé "murs.001"
        const murs = model.getObjectByName("murs.001");

        if (murs) {
          // Centre réel de murs.001
          const box = new THREE.Box3().setFromObject(murs);
          const center = box.getCenter(new THREE.Vector3());

          // OrbitControls tourne autour de ce point
          controls.target.copy(center);

          // Taille de l'objet
          const size = box.getSize(new THREE.Vector3());

          const distance =
            Math.max(size.x, size.y, size.z) * 2;

          // Positionnement caméra
          camera.position.set(
            center.x + distance,
            center.y + distance * 0.5,
            center.z + distance,
          );

          camera.lookAt(center);

          controls.update();
        } else {
          console.warn(
            'Objet "murs.001" introuvable dans le GLB',
          );
        }
      },

      undefined,

      (error) => {
        console.error("Erreur avec le modèle :", error);
      },
    );

    // RESIZE
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // ANIMATION
    const animate = () => {
      controls.update();

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // CLEANUP REACT
    return () => {
      window.removeEventListener("resize", handleResize);

      renderer.setAnimationLoop(null);

      controls.dispose();

      if (model) {
        scene.remove(model);

        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();

            if (Array.isArray(object.material)) {
              object.material.forEach((material) =>
                material.dispose(),
              );
            } else {
              object.material?.dispose();
            }
          }
        });
      }

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="three-scene" />;
}