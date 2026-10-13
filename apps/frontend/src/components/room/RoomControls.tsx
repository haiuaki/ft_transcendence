"use client"

import { DoorOpen, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useRoomControls, useRoomControlsActions } from "@/src/context/RoomControlsContext";

const RoomControls = () => {
    const { controls, nightMode } = useRoomControls();
    const { setNightMode } = useRoomControlsActions();
    const isLight = !nightMode;
    // the scene is busy loading or blending textures
    const busy = controls !== null && !controls.ready;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2">
                <p className="text-sm font-semibold text-black/60">Day / Night</p>
                <button
                    type="button"
                    role="switch"
                    aria-checked={nightMode}
                    aria-label="Switch between day and night"
                    onClick={() => setNightMode(!nightMode)}
                    disabled={busy}
                    className="relative flex h-9 w-[72px] cursor-pointer items-center justify-between rounded-full bg-white/60 p-1 ring-1 ring-ui-line
                        disabled:cursor-wait disabled:opacity-60
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                >
                    <motion.span
                        initial={false}
                        animate={{ x: isLight ? 0 : 36 }}
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className="absolute left-1 top-1 h-7 w-7 rounded-full bg-black shadow-md"
                    />
                    <span className={`relative z-10 flex h-7 w-7 items-center justify-center ${isLight ? "text-white" : "text-gray-400"}`}>
                        <Sun size={16} />
                    </span>
                    <span className={`relative z-10 flex h-7 w-7 items-center justify-center ${isLight ? "text-gray-400" : "text-white"}`}>
                        <Moon size={16} />
                    </span>
                </button>
            </div>
            {controls && (
                <button
                    type="button"
                    onClick={controls.onLeave}
                    disabled={!controls.onLeave}
                    className="cursor-pointer flex items-center gap-2 p-2 rounded-md text-left hover:bg-ui-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <DoorOpen size={12} />
                    <p>Leave room</p>
                </button>
            )}
        </div>
    );
};

export default RoomControls;
