import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createCameraControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer)
{
	// CAMERA CONTROLS
	const controls = new OrbitControls(camera, renderer.domElement);

	controls.enableDamping = true;
	controls.dampingFactor = 0.03;

	controls.minDistance = 100;
	controls.maxDistance = 500;

	controls.minPolarAngle = THREE.MathUtils.degToRad(0);

	controls.maxPolarAngle = THREE.MathUtils.degToRad(95);

	controls.minAzimuthAngle = THREE.MathUtils.degToRad(-3);

	controls.maxAzimuthAngle = THREE.MathUtils.degToRad(95);

	controls.enablePan = false;

	return controls;
}

export function centerCameraOnModel(
	model: THREE.Group,
	camera: THREE.PerspectiveCamera,
	controls: OrbitControls
): void
{
	let murs: THREE.Object3D | undefined;

	model.traverse((object) =>
	{
		const name = object.userData.name || object.name;

		if (name === "murs.001")
		{
			murs = object;
		}
	});

	if (murs)
	{
		const box = new THREE.Box3().setFromObject(murs);
		const center = box.getCenter(new THREE.Vector3());

		controls.target.copy(center);
		controls.target.x += 21;

		const size = box.getSize(new THREE.Vector3());
		const distance = Math.max(size.x, size.y, size.z) * 2;

		camera.position.set(
			center.x + distance,
			center.y + distance * 0.5,
			center.z + distance
		);

		controls.update();
	}
}
