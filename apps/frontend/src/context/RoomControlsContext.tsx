"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const NIGHT_MODE_KEY = "night-mode";

const nightListeners = new Set<() => void>();
let nightFallback = false;

function subscribeNight(listener: () => void) {
	nightListeners.add(listener);
	return () => {
		nightListeners.delete(listener);
	};
}

function readNight(): boolean {
	try {
		return localStorage.getItem(NIGHT_MODE_KEY) === "true";
	} catch {
		return nightFallback;
	}
}

function writeNight(night: boolean) {
	nightFallback = night;
	try {
		localStorage.setItem(NIGHT_MODE_KEY, String(night));
	} catch { }
	nightListeners.forEach((listener) => listener());
}

export type RoomControls = {
	ready: boolean;
};

export type CurrentRoom = { id: string; name: string };

type RoomControlsState = {
	controls: RoomControls | null;
	currentRoom: CurrentRoom | null;
	panelOpen: boolean;
	nightMode: boolean;
};

type RoomControlsActions = {
	setControls: (controls: RoomControls | null) => void;
	setCurrentRoom: (room: CurrentRoom | null) => void;
	setPanelOpen: (open: boolean) => void;
	setNightMode: (night: boolean) => void;
};

const StateContext = createContext<RoomControlsState>({ controls: null, currentRoom: null, panelOpen: false, nightMode: false });
const ActionsContext = createContext<RoomControlsActions>({
	setControls: () => { },
	setCurrentRoom: () => { },
	setPanelOpen: () => { },
	setNightMode: () => { },
});

export const RoomControlsProvider = ({ children }: { children: React.ReactNode }) => {
	const [controls, setControls] = useState<RoomControls | null>(null);
	const [currentRoom, setCurrentRoom] = useState<CurrentRoom | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const nightMode = useSyncExternalStore(subscribeNight, readNight, () => false);

	useEffect(() => {
		document.documentElement.classList.toggle("night", nightMode);
	}, [nightMode]);

	const state = useMemo(() => ({ controls, currentRoom, panelOpen, nightMode }), [controls, currentRoom, panelOpen, nightMode]);
	const actions = useMemo(() => ({
		setControls,
		setCurrentRoom,
		setPanelOpen,
		setNightMode: writeNight,
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
