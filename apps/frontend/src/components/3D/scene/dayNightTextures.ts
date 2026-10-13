import * as THREE from "three";
import { backgroundColors, switchableTextures } from "./config";
import type { SceneCallbacks, TextureMode } from "./types";

type SceneMaterial = THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;

type TextureReplacement = {
	material: SceneMaterial;
	texture: THREE.Texture;
};

type TextureTransition = {
	start: number;
	duration: number;
	from: THREE.Color;
	to: THREE.Color;
	finish: () => void;
};

export function createDayNightTextures(
	scene: THREE.Scene,
	renderer: THREE.WebGLRenderer,
	callbacks: SceneCallbacks
)
{
	const { setTextureMode, setTexturesLoading, setTexturesReady, setTransitioning, setTextureError } = callbacks;
	// TEXTURES
	let disposed = false;
	const textureLoader = new THREE.TextureLoader();
	const textureCache = new Map<string, Promise<THREE.Texture>>();
	const ownedTextures = new Set<THREE.Texture>();
	const materialMaps = new Map<SceneMaterial, THREE.Texture>();

	const blend = { value: 0 };
	const targetMaps = new Map<THREE.Material, { value: THREE.Texture }>();
	let transition: TextureTransition | null = null;
	let switching = false;

	async function createModeTexture(original: THREE.Texture, mode: TextureMode): Promise<THREE.Texture>
	{
		const textureName = encodeURIComponent(original.name);
		const texturePath = `/textures/${mode}/${textureName}.webp`;
		const loaded = await textureLoader.loadAsync(texturePath);

		const texture = original.clone();
		texture.source = loaded.source;
		texture.needsUpdate = true;
		loaded.dispose();

		if (disposed)
		{
			texture.dispose();
		} else
		{
			ownedTextures.add(texture);
			renderer.initTexture(texture);
		}

		return texture;
	}

	function loadModeTexture(original: THREE.Texture, mode: TextureMode): Promise<THREE.Texture>
	{
		const key = `${mode}:${original.uuid}`;
		const cachedTexture = textureCache.get(key);

		if (cachedTexture)
		{
			return cachedTexture;
		}

		const pending = createModeTexture(original, mode).catch((error: unknown) =>
		{
			textureCache.delete(key);
			throw error;
		});

		textureCache.set(key, pending);
		return pending;
	}

	async function loadReplacement(material: SceneMaterial, original: THREE.Texture, mode: TextureMode): Promise<TextureReplacement>
	{
		const texture = await loadModeTexture(original, mode);
		return { material, texture };
	}

	function prepareTextureBlend(material: SceneMaterial, texture: THREE.Texture): void
	{
		let targetMap = targetMaps.get(material);
		if (!targetMap)
		{
			targetMap = { value: texture };
			targetMaps.set(material, targetMap);
			const mapUniform = targetMap;
			material.onBeforeCompile = (shader) =>
			{
				shader.uniforms.modeBlend = blend;
				shader.uniforms.targetMap = mapUniform;

				const blendUniforms = `
                        uniform float modeBlend;
                        uniform sampler2D targetMap;
                    `;
				const blendFragment = `
                        #ifdef USE_MAP
                            vec4 currentColor = texture2D(map, vMapUv);
                            vec4 targetColor = texture2D(targetMap, vMapUv);
                            diffuseColor *= mix(currentColor, targetColor, modeBlend);
                        #endif
                    `;

				shader.fragmentShader = blendUniforms + shader.fragmentShader;
				shader.fragmentShader = shader.fragmentShader.replace(
					"#include <map_fragment>",
					blendFragment
				);
			};
			material.customProgramCacheKey = () =>
			{
				return "day-night-blend";
			};
			material.needsUpdate = true;
		}
		targetMap.value = texture;
	}

	async function switchMode(mode: TextureMode): Promise<void>
	{
		if (switching || disposed)
		{
			return;
		}
		switching = true;
		setTexturesLoading(true);
		setTextureError(null);
		try
		{
			const pendingReplacements: Promise<TextureReplacement>[] = [];
			for (const [material, original] of materialMaps)
			{
				pendingReplacements.push(loadReplacement(material, original, mode));
			}

			const replacements = await Promise.all(pendingReplacements);
			if (disposed)
			{
				return;
			}
			for (const replacement of replacements)
			{
				prepareTextureBlend(replacement.material, replacement.texture);
			}
			setTexturesLoading(false);
			setTransitioning(true);
			let transitionDuration = 1000;
			const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			if (reducedMotion)
			{
				transitionDuration = 0;
			}

			await new Promise<void>((resolve) =>
			{
				transition = {
					start: performance.now(),
					duration: transitionDuration,
					from: (scene.background as THREE.Color).clone(),
					to: new THREE.Color(backgroundColors[mode]),
					finish: resolve,
				};
			});
			if (disposed)
			{
				return;
			}
			for (const replacement of replacements)
			{
				replacement.material.map = replacement.texture;
			}
			blend.value = 0;
			setTextureMode(mode);
		} catch
		{
			if (!disposed)
			{
				setTextureError("Could not load textures. Please try again.");
			}
		} finally
		{
			switching = false;
			if (!disposed)
			{
				setTexturesLoading(false);
				setTransitioning(false);
			}
		}
	}

	async function preloadTextures(): Promise<void>
	{
		try
		{
			const originals = new Set(materialMaps.values());
			const pendingTextures: Promise<THREE.Texture>[] = [];

			for (const original of originals)
			{
				pendingTextures.push(loadModeTexture(original, "day"));
				pendingTextures.push(loadModeTexture(original, "night"));
			}

			await Promise.all(pendingTextures);
			if (disposed)
			{
				return;
			}

			setTexturesReady(true);
			await switchMode("day");
		} catch
		{
			if (disposed)
			{
				return;
			}
			setTexturesLoading(false);
			setTextureError("Could not load all textures. Reload the page to try again.");
		}
	}

	function collectMaterialTextures(object: THREE.Object3D): void
	{
		if (!(object instanceof THREE.Mesh))
		{
			return;
		}
		let materials: THREE.Material[];
		if (Array.isArray(object.material))
		{
			materials = object.material;
		} else
		{
			materials = [object.material];
		}
		for (const material of materials)
		{
			if (!(material instanceof THREE.MeshBasicMaterial)
				&& !(material instanceof THREE.MeshStandardMaterial))
			{
				continue;
			}
			if (!material.map)
			{
				continue;
			}
			if (!switchableTextures.has(material.map.name))
			{
				continue;
			}

			materialMaps.set(material, material.map);
		}
	}

	function initialize(model: THREE.Group): void
	{
		model.traverse(collectMaterialTextures);
		void preloadTextures();
	}

	function update(): void
	{
		if (transition)
		{
			let progress = 1;
			if (transition.duration !== 0)
			{
				const elapsed = performance.now() - transition.start;
				progress = Math.min(elapsed / transition.duration, 1);
			}

			blend.value = progress * progress * (3 - 2 * progress);
			(scene.background as THREE.Color).lerpColors(transition.from, transition.to, blend.value);
			if (progress === 1)
			{
				transition.finish();
				transition = null;
			}
		}
	}

	function dispose(): void
	{
		disposed = true;
		if (transition)
		{
			transition.finish();
		}
		transition = null;
		for (const texture of ownedTextures)
		{
			texture.dispose();
		}
	}

	return { initialize, switchMode, update, dispose };
}
