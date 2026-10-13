"use client";

import { Loader2 } from "lucide-react";
import SeatProfileView from "@/src/components/profile/SeatProfileView";

export type SeatProfileWindowProps = {
    onClose: () => void;
    username?: string;
    loading: boolean;
    error: string;
    seatIndex: number;
};

export default function SeatProfileWindow({ onClose, username, loading, error, seatIndex }: SeatProfileWindowProps) {
    return (
        <div role="dialog" aria-label={`R1s${seatIndex + 1} profile`} className="fixed top-5 right-5 z-[9999] max-h-[calc(100dvh-2.5rem)] w-[420px] max-w-[calc(100vw-2.5rem)] overflow-y-auto custom-scrollbar rounded-2xl bg-white p-6 text-black shadow-2xl ring-1 ring-black/10">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">R1s{seatIndex + 1} profile</h2>
                <button onClick={onClose} aria-label="Close profile" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-black/50 transition-all duration-200 hover:bg-black/5 hover:text-black">✕</button>
            </div>
            {error ? <p role="alert" className="py-6 text-center">{error}</p>
                : loading ? <div className="flex justify-center py-6"><Loader2 className="animate-spin" aria-label="Loading" /></div>
                : username ? <SeatProfileView key={username} username={username} />
                : <p className="py-10 text-center text-black/50">empty seat</p>}
        </div>
    );
}
