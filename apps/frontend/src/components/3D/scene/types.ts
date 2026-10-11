export type TextureMode = "day" | "night";
export type SwitchMode = (mode: TextureMode) => Promise<void>;

export type SceneCallbacks = {
	setTextureMode: (mode: TextureMode) => void;
	setTexturesLoading: (loading: boolean) => void;
	setTexturesReady: (ready: boolean) => void;
	setTransitioning: (transitioning: boolean) => void;
	setTextureError: (error: string | null) => void;
	setSelectedGroup: (group: string) => void;
};
