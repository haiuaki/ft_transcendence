"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import roomService from "@/src/services/roomService";
import SeatProfileView from "@/src/components/profile/SeatProfileView";

type SeatProfileWindowProps = {
    onClose: () => void;
    roomId?: string;
    seatIndex: number;
};

export default function SeatProfileWindow({ onClose, roomId, seatIndex }: SeatProfileWindowProps) {
    const { token } = useAuth();
    const [seat, setSeat] = useState<{ roomId: string; username?: string } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token || !roomId) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        const refresh = async () => {
            try {
                const members = await roomService.members(token, roomId, controller.signal);
                if (controller.signal.aborted) return;
                setSeat({ roomId, username: members[seatIndex]?.username });
                setError("");
            } catch (e) {
                if (controller.signal.aborted) return;
                setError(e instanceof Error ? e.message : "Failed to fetch room members");
            }
            timer = setTimeout(refresh, 3000);
        };
        void refresh();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [token, roomId, seatIndex]);

    const username = seat?.roomId === roomId ? seat?.username : undefined;
    return (
        <div role="dialog" aria-label={`R1s${seatIndex + 1} profile`} className="fixed top-5 right-5 z-[9999] max-h-[calc(100dvh-2.5rem)] w-[420px] max-w-[calc(100vw-2.5rem)] overflow-y-auto custom-scrollbar rounded-2xl bg-white p-6 text-black shadow-2xl ring-1 ring-black/10">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">R1s{seatIndex + 1} profile</h2>
                <button onClick={onClose} aria-label="Close profile" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-black/50 transition-all duration-200 hover:bg-black/5 hover:text-black">✕</button>
            </div>
            {error ? <p role="alert" className="py-6 text-center">{error}</p>
                : roomId && seat?.roomId !== roomId ? <div className="flex justify-center py-6"><Loader2 className="animate-spin" aria-label="Loading" /></div>
                : username ? <SeatProfileView key={username} username={username} />
                : <p className="py-10 text-center text-black/50">empty seat</p>}
        </div>
    );
}
