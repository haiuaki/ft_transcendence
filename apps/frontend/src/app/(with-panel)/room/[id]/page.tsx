"use client"

import { CircleX, Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import roomService, { ApiError, type Room } from "@/src/services/roomService";
import { useAuth } from "@/src/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import RoomView from "@/src/components/room/RoomView";
import InfoView from "@/src/components/room/InfoView";
import { useRoomControlsActions } from "@/src/context/RoomControlsContext";
import RoomPasswordView from "@/src/components/room/RoomPasswordView";

type Step = "loading" | "error" | "password_required" | "success"

const RoomContent = () => {
    const params = useParams<{ id: string }>();
    const { token, isLoading } = useAuth();
    const router = useRouter();
    const { setCurrentRoom } = useRoomControlsActions();
    const [step, setStep] = useState<Step>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) return;
        if (!token) {
            router.replace("/login");
            return;
        }

        let cancelled = false;
        const fetchRoom = async () => {
            setStep("loading")
            try {
                const rooms: Room[] = await roomService.rooms(token);
                if (cancelled) return;
                const roomId = Number(params.id);
                const found = rooms.find((item) => item.id === roomId);

                if (!found) {
                    setStep("error");
                    setError("This room doesn't exist or is no longer available.")
                    return;
                }
                try {
                    await roomService.join(token || "", params.id, undefined);
                    if (cancelled) return;
                    setCurrentRoom({ id: params.id, name: found.name });
                    toast.success("Successfully joined the room.", { id: "room-joined" });
                    setStep("success");
                } catch (e) {
                    if (cancelled) return;
                    if (e instanceof ApiError && e.status === 401) {
                        setStep("password_required");
                        return;
                    }
                    throw e;
                }
            } catch (e) {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : "Failed to fetch the room")
                setStep("error")
            }
        };

        fetchRoom();
        return () => { cancelled = true; };
    }, [isLoading, params.id, token, router, setCurrentRoom]);

    return (
        <div className="scene-page">
            {step === "loading" && <InfoView icon={<Loader2 size={38} className="animate-spin" />} text="Connecting to the room..." />}
            {step === "error" && <InfoView icon={<CircleX size={38} />} text={error} />}
            {step === "password_required" && <RoomPasswordView roomId={params.id} onSuccess={() => setStep("success")} />}
           {step === "success" && <RoomView roomId={params.id} />}

        </div>
    )
}
export default function RoomPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RoomContent />
        </Suspense>
    );
}
