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


export default function ThreeScene() {
	const containerRef = useRef<HTMLDivElement>(null);

	const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

	useEffect(() => {
		const container = containerRef.current;

		if (!container)
			return;

		// SCENE
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xFFFFFF);

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
			members: ["menu", "Cube.003"],
			objects: [] as THREE.Object3D[],
		},
		
		{
			name: "user.r1s1",
			members: ["user.r1s1"],
			objects: [] as THREE.Object3D[],
		},

		{
			name: "user.r1s2",
			members: ["user.r1s1.001"],
			objects: [] as THREE.Object3D[],
		},

		{
			name: "user.r1s3",
			members: ["user.r1s1.002"],
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

		//CHARGEMENT DU MODELE
		const loader = new GLTFLoader();
		
		loader.load("/assets/cluster.glb", (gltf) => {
				model = gltf.scene;
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