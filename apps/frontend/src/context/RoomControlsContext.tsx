"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const NIGHT_MODE_KEY = "night-mode";

export type RoomControls = {
	ready: boolean;
	onLeave?: () => void;
};

type RoomControlsState = {
	controls: RoomControls | null;
	panelOpen: boolean;
	nightMode: boolean;
};

type RoomControlsActions = {
	setControls: (controls: RoomControls | null) => void;
	setPanelOpen: (open: boolean) => void;
	setNightMode: (night: boolean) => void;
};

const StateContext = createContext<RoomControlsState>({ controls: null, panelOpen: false, nightMode: false });
const ActionsContext = createContext<RoomControlsActions>({
	setControls: () => { },
	setPanelOpen: () => { },
	setNightMode: () => { },
});

export const RoomControlsProvider = ({ children }: { children: React.ReactNode }) => {
	const [controls, setControls] = useState<RoomControls | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [nightMode, setNightMode] = useState(false);

	// read after mount so server and client first renders match
	useEffect(() => {
		try {
			if (localStorage.getItem(NIGHT_MODE_KEY) === "true") {
				setNightMode(true);
			}
		} catch { }
	}, []);

	// the "night" class remaps the white/black theme colors, see globals.css
	useEffect(() => {
		document.documentElement.classList.toggle("night", nightMode);
	}, [nightMode]);

	const state = useMemo(() => ({ controls, panelOpen, nightMode }), [controls, panelOpen, nightMode]);
	// setters are stable, so consumers of the actions never re-render on state change
	const actions = useMemo(() => ({
		setControls,
		setPanelOpen,
		setNightMode: (night: boolean) => {
			setNightMode(night);
			try {
				localStorage.setItem(NIGHT_MODE_KEY, String(night));
			} catch { }
		},
	}), []);

	return (
		<ActionsContext.Provider value={actions}>
			<StateContext.Provider value={state}>
				{children}
			</StateContext.Provider>
		</ActionsContext.Provider>
	);
};

export const useRoomControls = () => useContext(StateContext);
export const useRoomControlsActions = () => useContext(ActionsContext);
