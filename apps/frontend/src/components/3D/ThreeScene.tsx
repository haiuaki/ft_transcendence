"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import KewanWindow from "./windows/KewanWindow";
import MenuWindow from "./windows/MenuWindow";
import PorteWindow from "./windows/PorteWindow";
import R1s1Window from "./windows/r1s1Window";
import R1s2Window from "./windows/r1s2Window";
import R1s3Window from "./windows/r1s3Window";


const switchableTextures = new Set([ "Untitled", "Untitled.001", "Untitled.002", "Untitled.003", "Untitled.004", "Untitled.005", "Untitled.006", "Untitled.007", "Untitled.008", "Untitled.009", "Untitled.010", "Untitled.011", "Untitled.012", "Untitled.013", "Untitled.014", "Untitled.015", "Untitled.016",]);

type TextureMode = "day" | "night";

const backgroundColors: Record<TextureMode, number> = {
	day: 0xfffdff,
	night: 0x3f526a,
};

export default function ThreeScene() {
	const containerRef = useRef<HTMLDivElement>(null);
	const switchModeRef = useRef<((mode: TextureMode) => Promise<void>) | null>(null);
	const [textureMode, setTextureMode] = useState<TextureMode>("day");
	const [texturesLoading, setTexturesLoading] = useState(true);
	const [texturesReady, setTexturesReady] = useState(false);
	const [transitioning, setTransitioning] = useState(false);
	const [textureError, setTextureError] = useState<string | null>(null);

	const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

	useEffect(() => {
		const container = containerRef.current;

		if (!container)
			return;

		// SCENE
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(backgroundColors.day);

		//CAMERA
		const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);

		camera.position.set(250, 250, 250);

		//RENDERER
		 const renderer = new THREE.WebGLRenderer({ antialias: true, });

		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(container.clientWidth, container.clientHeight);

		container.appendChild(renderer.domElement);
	
		const composer = new EffectComposer(renderer);

		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);

		const outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth,container.clientHeight), scene, camera);
		outlinePass.visibleEdgeColor.set(0xffffff);
		outlinePass.hiddenEdgeColor.set(0x000000);
	    outlinePass.edgeStrength = 5;
	    outlinePass.edgeThickness = 2;
		composer.addPass(outlinePass);

	    const outputPass = new OutputPass();
	    composer.addPass(outputPass);

		// CATÉGORIES INTERACTIVES
		const interactionGroups = [
		{
			name: "porte",
			members: ["porte gauche", "porte droite", "poignee", "Cube", "separation"],
			objects: [] as THREE.Object3D[],
		},

		{
			name: "menu",
			members: ["menu", "menu.cadre"],
			objects: [] as THREE.Object3D[],
		},
		
		{
			name: "user.r1s1",
			members: ["user.r1s1"],
			objects: [] as THREE.Object3D[],
		},

		{
			name: "user.r1s2",
			members: ["user.r1s2"],
			objects: [] as THREE.Object3D[],
		},

		{
			name: "user.r1s3",
			members: ["user.r1s3"],
			objects: [] as THREE.Object3D[],
		},

		{
			name: "mesh_node",
			members: ["mesh_node"],
			objects: [] as THREE.Object3D[],
		},
		];

		const groupsByObjectName = new Map(
			interactionGroups.flatMap((group) =>
				group.members.map(
					(name) => [name, group] as const
				)
			)
		);

		const interactiveObjects = new Map<THREE.Object3D, (typeof interactionGroups)[number]>();

		// RAYCASTER
		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();

		let pointerInside = false;
		let model: THREE.Group | null = null;

		//UPDATE POSITION DE LA SOURIS
		const updatePointer = (event: PointerEvent) => {
		const bounds = renderer.domElement.getBoundingClientRect();

		pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);

		pointerInside =
		event.clientX >= bounds.left
		&& event.clientX <= bounds.right
		&& event.clientY >= bounds.top
		&& event.clientY <= bounds.bottom;
		};

		//GROUPE POINTE
		const getPointedGroup = () => {

			if (!model || !pointerInside)
				return null;
			
			raycaster.setFromCamera(pointer, camera);

			const intersection = raycaster.intersectObject(model, true)[0];

			let object: THREE.Object3D | null = intersection?.object ?? null;

			while (object)
			{
				const group = interactiveObjects.get(object);

				if (group)
					return group;

				object = object.parent;
			}

			return null;
		};

		const handlePointerMove = (event: PointerEvent) => {
		    updatePointer(event);

		    const offset = camera.position.clone().sub(controls.target);

		    const spherical = new THREE.Spherical().setFromVector3(offset);

		    spherical.theta -= event.movementX * 0.001;
		    spherical.phi   -= event.movementY * 0.001;

		    spherical.phi = THREE.MathUtils.clamp(spherical.phi,THREE.MathUtils.degToRad(5),THREE.MathUtils.degToRad(175));

		    offset.setFromSpherical(spherical);

		    camera.position.copy(controls.target.clone().add(offset));

	 	   camera.lookAt(controls.target);
		};

		const handlePointerLeave = () => {
			pointerInside = false;

			outlinePass.selectedObjects = [];

			renderer.domElement.style.cursor = "";
		};

		renderer.domElement.addEventListener("pointermove", handlePointerMove);
		renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

		//ORBIT CONTROLS
		const controls = new OrbitControls(camera,renderer.domElement);

		controls.enableDamping = true;
		controls.dampingFactor = 0.03;

		controls.minDistance = 100;
		controls.maxDistance = 500;

		controls.minPolarAngle = THREE.MathUtils.degToRad(0);

		controls.maxPolarAngle = THREE.MathUtils.degToRad(95);

		controls.minAzimuthAngle = THREE.MathUtils.degToRad(-3);

		controls.maxAzimuthAngle = THREE.MathUtils.degToRad(95);

		controls.enablePan = false;

		// LUMIÈRE
		const ambientLight = new THREE.AmbientLight(0x000000, 100);
		scene.add(ambientLight);

		// NIGHT MODE
		let disposed = false;
		const textureLoader = new THREE.TextureLoader();
		const textureCache = new Map<string, Promise<THREE.Texture>>();
		const ownedTextures = new Set<THREE.Texture>();
		const materialMaps = new Map<THREE.MeshBasicMaterial | THREE.MeshStandardMaterial, THREE.Texture>();

		const blend = { value: 0 };
		const targetMaps = new Map<THREE.Material, { value: THREE.Texture }>();
		let transition: {
			start: number;
			duration: number;
			from: THREE.Color;
			to: THREE.Color;
			finish: () => void;
		} | null = null;
		let switching = false;

		const loadModeTexture = (original: THREE.Texture, mode: TextureMode) => {
			const key = `${mode}:${original.uuid}`;
			let pending = textureCache.get(key);
			if (!pending)
			{
				pending = textureLoader.loadAsync(`/textures/${mode}/${encodeURIComponent(original.name)}.png`)
					.then((loaded) => {
						const texture = original.clone();
						texture.source = loaded.source;
						texture.needsUpdate = true;
						loaded.dispose();
						if (disposed) texture.dispose();
						else {
							ownedTextures.add(texture);
							renderer.initTexture(texture);
						}
						return texture;
					}).catch((error: unknown) => {
						textureCache.delete(key);
						throw error;
					});
				textureCache.set(key, pending);
			}
			return pending;
		};

		const switchMode = async (mode: TextureMode) => {
			if (switching || disposed) return;
			switching = true;
			setTexturesLoading(true);
			setTextureError(null);
			try {
				const replacements = await Promise.all(Array.from(materialMaps, async ([material, original]) =>
					({ material, texture: await loadModeTexture(original, mode) })
				));
				if (disposed) return;
				for (const { material, texture } of replacements) {
					let targetMap = targetMaps.get(material);
					if (!targetMap) {
						targetMap = { value: texture };
						targetMaps.set(material, targetMap);
						const mapUniform = targetMap;
						material.onBeforeCompile = (shader) => {
							shader.uniforms.modeBlend = blend;
							shader.uniforms.targetMap = mapUniform;
							shader.fragmentShader = `uniform float modeBlend;
								uniform sampler2D targetMap;
						` + shader.fragmentShader;
							shader.fragmentShader = shader.fragmentShader.replace(
								"#include <map_fragment>",
								`#ifdef USE_MAP
									diffuseColor *= mix(texture2D(map, vMapUv), texture2D(targetMap, vMapUv), modeBlend);
								#endif`
							);
						};
						material.customProgramCacheKey = () => "day-night-blend";
						material.needsUpdate = true;
					}
					targetMap.value = texture;
				}
				setTexturesLoading(false);
				setTransitioning(true);
				await new Promise<void>((resolve) => {
					transition = {
						start: performance.now(),
						duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1000,
						from: (scene.background as THREE.Color).clone(),
						to: new THREE.Color(backgroundColors[mode]),
						finish: resolve,
					};
				});
				if (disposed) return;
				for (const { material, texture } of replacements) material.map = texture;
				blend.value = 0;
				setTextureMode(mode);
			} catch (error) {
				if (!disposed) {
					console.error("Could not load scene textures:", error);
					setTextureError("Could not load textures. Please try again.");
				}
			} finally {
				switching = false;
				if (!disposed) {
					setTexturesLoading(false);
					setTransitioning(false);
				}
			}
		};

		//CHARGEMENT DU MODELE
		const loader = new GLTFLoader();
		
		loader.load("/assets/cluster.glb", (gltf) => {
				if (disposed) return;
				model = gltf.scene;
				model.traverse((object) => {
					if (!(object instanceof THREE.Mesh)) return;
					const materials = Array.isArray(object.material) ? object.material : [object.material];
					for (const material of materials) {
						if ((material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshStandardMaterial)
							&& material.map && switchableTextures.has(material.map.name)) {
							materialMaps.set(material, material.map);
						}
					}
				});
				void (async () => {
					try {
						await Promise.all(Array.from(new Set(materialMaps.values()), async (original) => {
							await Promise.all([
								loadModeTexture(original, "day"),
								loadModeTexture(original, "night"),
							]);
						}));
						if (disposed) return;
						switchModeRef.current = switchMode;
						setTexturesReady(true);
						await switchMode("day");
					} catch (error) {
						if (disposed) return;
						console.error("Could not preload day/night textures:", error);
						setTexturesLoading(false);
						setTextureError("Could not load all textures. Reload the page to try again.");
					}
				})();
				model.scale.set(1, 1, 1);
				model.rotation.y = Math.PI / 2;
				scene.add(model);

			//ASSOCIER OBJETS AUX CATEGORIES
			model.traverse((object) => {
				const name = object.userData.name || object.name;
				const group = groupsByObjectName.get(name);
				if (group)
				{
					group.objects.push(object);

					interactiveObjects.set(object, group);
				}
			});

			//CENTRAGE DE LA CAM
			let murs: THREE.Object3D | undefined;

			model.traverse((object) => {
				const name = object.userData.name || object.name;

				if (name === "murs.001")
					murs = object;
			});

				if (murs)
				{
					const box = new THREE.Box3().setFromObject(murs);
					const center = box.getCenter(new THREE.Vector3());

					controls.target.copy(center);
					controls.target.x += 21;

					const size = box.getSize(new THREE.Vector3());
					const distance = Math.max(size.x, size.y, size.z) * 2;

					camera.position.set(center.x + distance, center.y + distance * 0.5, center.z + distance);

					camera.lookAt(center);

					controls.update();
				}
				else 
					console.warn('Objet "murs.001" introuvable dans le GLB');
				},

				undefined,

				(error) => {
					console.error("Erreur avec le modèle :", error);
					if (!disposed) {
						setTexturesLoading(false);
						setTextureError("Could not load the scene.");
					}
				}
		);
		//RESIZE
		const handleResize = () => {
			const width = container.clientWidth;

			const height = container.clientHeight;

			camera.aspect = width / height;

			camera.updateProjectionMatrix();

			renderer.setSize(width, height);

			composer.setSize(width, height);

			outlinePass.resolution.set(width, height);
		};

		window.addEventListener("resize", handleResize);

		//CLIC
		const handleClick = () => {
			const group = getPointedGroup();

			if (group)
				setSelectedGroup(group.name);
		};

		renderer.domElement.addEventListener("click", handleClick);

		

		// ANIMATION
		const animate = () => {
			if (transition) {
				const progress = transition.duration === 0 ? 1 : Math.min((performance.now() - transition.start) / transition.duration, 1);
				blend.value = progress * progress * (3 - 2 * progress);
				(scene.background as THREE.Color).lerpColors(transition.from, transition.to, blend.value);
				if (progress === 1) {
					transition.finish();
					transition = null;
				}
			}
			controls.update();

			scene.updateMatrixWorld();
			camera.updateMatrixWorld();

			const hoveredGroup = getPointedGroup();

			outlinePass.selectedObjects = hoveredGroup ? hoveredGroup.objects : [];

			renderer.domElement.style.cursor = hoveredGroup ? "pointer" : "";

			composer.render();
		};

		renderer.setAnimationLoop(animate);

		// CLEANUP REACT
		return () => {
			disposed = true;
			transition?.finish();
			transition = null;
			switchModeRef.current = null;
			ownedTextures.forEach((texture) => texture.dispose());
			renderer.setAnimationLoop(null);

			window.removeEventListener("resize", handleResize);

			renderer.domElement.removeEventListener("pointermove", handlePointerMove);

			renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);

			controls.dispose();

			composer.dispose();

			renderer.dispose();

			renderer.domElement.removeEventListener("click", handleClick);

			if (container.contains(renderer.domElement))
				container.removeChild(renderer.domElement);
		};
		
	}, []);
	return (
		<>
			<div
				ref={containerRef}
				className="three-scene"
			/>

			<div className="fixed right-4 bottom-4 z-10 flex flex-col items-end gap-2">
				<button
					type="button"
					aria-label="Night mode"
					aria-pressed={textureMode === "night"}
					disabled={!texturesReady || texturesLoading || transitioning}
					onClick={() => void switchModeRef.current?.(textureMode === "day" ? "night" : "day")}
					className="rounded-full border border-slate-300 bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-60"
				>
					{texturesLoading ? "Loading day & night…" : !texturesReady ? "Textures unavailable" : transitioning ? "Switching…" : textureMode === "day" ? "Switch to night" : "Switch to day"}
				</button>
				{textureError && <p role="alert" className="rounded bg-white px-3 py-2 text-sm text-red-700">{textureError}</p>}
			</div>

			{selectedGroup === "menu" && (
				<MenuWindow
				onClose={() => setSelectedGroup(null)}
			/>
			)}

			{selectedGroup === "mesh_node" && (
				<KewanWindow
				onClose={() => setSelectedGroup(null)}
			/>
			)}

			{selectedGroup === "porte" && (
				<PorteWindow
				onClose={() => setSelectedGroup(null)}
			/>
			)}

			{selectedGroup === "user.r1s1" && (
				<R1s1Window
				onClose={() => setSelectedGroup(null)}
			/>
			)}

			{selectedGroup === "user.r1s2" && (
				<R1s2Window
				onClose={() => setSelectedGroup(null)}
			/>
			)}

			{selectedGroup === "user.r1s3" && (
				<R1s3Window
				onClose={() => setSelectedGroup(null)}
			/>
			)}
		</>
	);
}
