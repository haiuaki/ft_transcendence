"use client";

import { useEffect, useRef, useState } from "react";
import { createScene } from "./scene/createScene";
import type { SwitchMode, TextureMode } from "./scene/types";
import SceneLoading from "./ui/SceneLoading";
import SceneModeButton from "./ui/SceneModeButton";
import SceneWindows from "./ui/SceneWindows";

export default function ThreeScene()
{
	const containerRef = useRef<HTMLDivElement>(null);
	const switchModeRef = useRef<SwitchMode | null>(null);
	const [textureMode, setTextureMode] = useState<TextureMode>("day");
	const [texturesLoading, setTexturesLoading] = useState(true);
	const [texturesReady, setTexturesReady] = useState(false);
	const [transitioning, setTransitioning] = useState(false);
	const [textureError, setTextureError] = useState<string | null>(null);

	const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

	useEffect(() =>
	{
		const container = containerRef.current;
		if (!container)
		{
			return;
		}

		const scene = createScene(container, {
			setTextureMode,
			setTexturesLoading,
			setTexturesReady,
			setTransitioning,
			setTextureError,
			setSelectedGroup,
		});
		switchModeRef.current = scene.switchMode;

		return () =>
		{
			switchModeRef.current = null;
			scene.dispose();
		};
	}, []);

	function closeWindow(): void
	{
		setSelectedGroup(null);
	}

	function handleModeClick(): void
	{
		const changeMode = switchModeRef.current;
		if (!changeMode)
		{
			return;
		}

		let nextMode: TextureMode = "day";
		if (textureMode === "day")
		{
			nextMode = "night";
		}

		void changeMode(nextMode);
	}

	return (
		<>
			<div className="relative isolate h-full w-full overflow-hidden">
				<div
					ref={containerRef}
					className="three-scene"
					aria-busy={texturesLoading}
				/>
				{texturesLoading && <SceneLoading />}
			</div>

			{!texturesLoading && (
				<SceneModeButton
					textureMode={textureMode}
					texturesReady={texturesReady}
					transitioning={transitioning}
					textureError={textureError}
					onClick={handleModeClick}
				/>
			)}

			<SceneWindows selectedGroup={selectedGroup} onClose={closeWindow} />
		</>
	);
}
