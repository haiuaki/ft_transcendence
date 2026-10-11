import * as THREE from "three";
import type { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";

type InteractionGroup = {
	name: string;
	members: string[];
	objects: THREE.Object3D[];
};

export function createSceneInteractions(
	renderer: THREE.WebGLRenderer,
	camera: THREE.PerspectiveCamera,
	outlinePass: OutlinePass,
	onSelect: (group: string) => void
)
{
	const interactionGroups: InteractionGroup[] = [
		{
			name: "menu",
			members: ["menu", "menu.cadre"],
			objects: [],
		},

		{
			name: "user.r1s1",
			members: ["user.r1s1"],
			objects: [],
		},

		{
			name: "user.r1s2",
			members: ["user.r1s2"],
			objects: [],
		},

		{
			name: "user.r1s3",
			members: ["user.r1s3"],
			objects: [],
		},

		{
			name: "mesh_node",
			members: ["mesh_node"],
			objects: [],
		},
	];

	const groupsByObjectName = new Map<string, InteractionGroup>();
	const interactiveObjects = new Map<THREE.Object3D, InteractionGroup>();

	for (const group of interactionGroups)
	{
		for (const name of group.members)
		{
			groupsByObjectName.set(name, group);
		}
	}

	// RAYCASTER
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();

	let pointerInside = false;
	let model: THREE.Group | null = null;

	// MOUSE POSITION
	function updatePointer(event: PointerEvent): void
	{
		const bounds = renderer.domElement.getBoundingClientRect();

		const relativeX = (event.clientX - bounds.left) / bounds.width;
		const relativeY = (event.clientY - bounds.top) / bounds.height;
		pointer.set(relativeX * 2 - 1, 1 - relativeY * 2);

		pointerInside =
			event.clientX >= bounds.left
			&& event.clientX <= bounds.right
			&& event.clientY >= bounds.top
			&& event.clientY <= bounds.bottom;
	}

	// POINTED OBJECT
	function getPointedGroup(): InteractionGroup | null
	{
		if (!model || !pointerInside)
		{
			return null;
		}

		raycaster.setFromCamera(pointer, camera);

		const intersection = raycaster.intersectObject(model, true)[0];

		let object: THREE.Object3D | null = null;
		if (intersection)
		{
			object = intersection.object;
		}

		while (object)
		{
			const group = interactiveObjects.get(object);

			if (group)
			{
				return group;
			}

			object = object.parent;
		}

		return null;
	}

	function handlePointerMove(event: PointerEvent): void
	{
		updatePointer(event);
	}

	function handlePointerLeave(): void
	{
		pointerInside = false;

		outlinePass.selectedObjects = [];

		renderer.domElement.style.cursor = "";
	}

	renderer.domElement.addEventListener("pointermove", handlePointerMove);
	renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

	// CLIC
	function handleClick(): void
	{
		const group = getPointedGroup();

		if (group)
		{
			onSelect(group.name);
		}
	}

	renderer.domElement.addEventListener("click", handleClick);

	function setModel(loadedModel: THREE.Group): void
	{
		model = loadedModel;
		model.traverse((object) =>
		{
			const name = object.userData.name || object.name;
			const group = groupsByObjectName.get(name);
			if (group)
			{
				group.objects.push(object);

				interactiveObjects.set(object, group);
			}
		});
	}

	function update(): void
	{
		const hoveredGroup = getPointedGroup();

		if (hoveredGroup)
		{
			outlinePass.selectedObjects = hoveredGroup.objects;
			renderer.domElement.style.cursor = "pointer";
		} else
		{
			outlinePass.selectedObjects = [];
			renderer.domElement.style.cursor = "";
		}
	}

	function dispose(): void
	{
		renderer.domElement.removeEventListener("pointermove", handlePointerMove);
		renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
		renderer.domElement.removeEventListener("click", handleClick);
	}

	return { setModel, update, dispose };
}
