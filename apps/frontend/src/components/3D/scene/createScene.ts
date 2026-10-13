import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { backgroundColors } from "./config";
import { createCameraControls, centerCameraOnModel } from "./sceneCamera";
import { createDayNightTextures } from "./dayNightTextures";
import { createSceneInteractions } from "./sceneInteractions";
import type { SceneCallbacks } from "./types";

export function createScene(container: HTMLDivElement, callbacks: SceneCallbacks)
{
	let disposed = false;
	// SCENE
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(backgroundColors.day);

	// CAMERA
	const camera = new THREE.PerspectiveCamera(
		45,
		container.clientWidth / container.clientHeight,
		0.1,
		10000
	);

	camera.position.set(250, 250, 250);

	// RENDER
	const renderer = new THREE.WebGLRenderer({ antialias: true, });

	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(container.clientWidth, container.clientHeight);

	container.appendChild(renderer.domElement);

	const composer = new EffectComposer(renderer);

	const renderPass = new RenderPass(scene, camera);
	composer.addPass(renderPass);

	const outlinePass = new OutlinePass(
		new THREE.Vector2(container.clientWidth, container.clientHeight),
		scene,
		camera
	);
	outlinePass.visibleEdgeColor.set(0xffffff);
	outlinePass.hiddenEdgeColor.set(0x000000);
	outlinePass.edgeStrength = 5;
	outlinePass.edgeThickness = 2;
	composer.addPass(outlinePass);

	const outputPass = new OutputPass();
	composer.addPass(outputPass);

	const interactions = createSceneInteractions(renderer, camera, outlinePass, callbacks.setSelectedGroup);
	const controls = createCameraControls(camera, renderer);
	// LIGHT
	const ambientLight = new THREE.AmbientLight(0x000000, 100);
	scene.add(ambientLight);

	const textures = createDayNightTextures(scene, renderer, callbacks);
	const loader = new GLTFLoader();

	function handleModelLoaded(gltf: GLTF): void
	{
		if (disposed)
		{
			return;
		}

		const model = gltf.scene;
		textures.initialize(model);
		model.scale.set(1, 1, 1);
		model.rotation.y = Math.PI / 2;
		scene.add(model);
		interactions.setModel(model);
		centerCameraOnModel(model, camera, controls);
	}

	function handleModelError(error: unknown): void
	{
		if (!disposed)
		{
			callbacks.setTexturesLoading(false);
			callbacks.setTextureError("Could not load the scene.");
		}
	}

	loader.load(
		"/assets/cluster.glb",
		handleModelLoaded,
		undefined,
		handleModelError
	);

	// RESIZE
	function handleResize(): void
	{
		const width = container.clientWidth;

		const height = container.clientHeight;

		camera.aspect = width / height;

		camera.updateProjectionMatrix();

		renderer.setSize(width, height);

		composer.setSize(width, height);

		outlinePass.resolution.set(width, height);
	}

	const resizeObserver = new ResizeObserver(handleResize);
	resizeObserver.observe(container);

	function animate(): void
	{
		textures.update();
		controls.update();
		scene.updateMatrixWorld();
		camera.updateMatrixWorld();
		interactions.update();
		composer.render();
	}

	renderer.setAnimationLoop(animate);

	function dispose(): void
	{
		disposed = true;
		textures.dispose();
		renderer.setAnimationLoop(null);
		resizeObserver.disconnect();
		interactions.dispose();
		controls.dispose();
		composer.dispose();
		renderer.dispose();

		if (container.contains(renderer.domElement))
		{
			container.removeChild(renderer.domElement);
		}
	}

	return { switchMode: textures.switchMode, dispose };
}
