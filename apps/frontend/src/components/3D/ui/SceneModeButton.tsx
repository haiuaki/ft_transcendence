import type { TextureMode } from "../scene/types";

type SceneModeButtonProps = {
	textureMode: TextureMode;
	texturesReady: boolean;
	transitioning: boolean;
	textureError: string | null;
	onClick: () => void;
};

export default function SceneModeButton(props: SceneModeButtonProps)
{
	const { textureMode, texturesReady, transitioning, textureError, onClick } = props;
	let modeButtonColors = "bg-black text-white hover:bg-black/90 focus-visible:outline-black";
	if (textureMode === "night")
	{
		modeButtonColors = "bg-white text-black hover:bg-white/90 focus-visible:outline-white";
	}

	let modeButtonLabel: string;
	if (!texturesReady)
	{
		modeButtonLabel = "Textures unavailable";
	} else if (transitioning)
	{
		modeButtonLabel = "Switching…";
	} else if (textureMode === "day")
	{
		modeButtonLabel = "Switch to night";
	} else
	{
		modeButtonLabel = "Switch to day";
	}

	return (
		<div className="fixed right-4 bottom-4 z-10 flex flex-col items-end gap-2">
			<button
				type="button"
				aria-label="Night mode"
				aria-pressed={textureMode === "night"}
				disabled={!texturesReady || transitioning}
				onClick={onClick}
				className={`cursor-pointer rounded-md p-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-60 ${modeButtonColors}`}
			>
				{modeButtonLabel}
			</button>
			{textureError && (
				<p role="alert" className="rounded bg-white px-3 py-2 text-sm text-red-700">
					{textureError}
				</p>
			)}
		</div>
	);
}
