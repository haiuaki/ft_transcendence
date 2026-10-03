"use client"

import { CircleX, Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import roomService, { ApiError, type Room } from "@/src/services/roomService";
import { useAuth } from "@/src/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import RoomView from "@/src/components/room/RoomView";
import InfoView from "@/src/components/room/InfoView";
import RoomPasswordView from "@/src/components/room/RoomPasswordView";

type Step = "loading" | "error" | "password_required" | "success"

const RoomContent = () => {
    const params = useParams<{ id: string }>();
    const { token, isLoading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<Step>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) return;
        if (!token) {
            router.replace("/login");
            return;
        }

        const fetchRoom = async () => {
            setStep("loading")
            try {
                const rooms: Room[] = await roomService.rooms(token);
                const roomId = Number(params.id);
                const currentRoom = rooms.find((item) => item.id === roomId);

                if (!currentRoom) {
                    setStep("error");
                    setError("This room doesn't exist or is no longer available.")
                    return;
                }
                try {
                    await roomService.join(token || "", params.id, undefined);
                    toast.success("Successfully joined the room.");
                    setStep("success");
                } catch (e) {
                    if (e instanceof ApiError && e.status === 401) {
                        setStep("password_required");
                        return;
                    }
                    throw e;
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch the room")
                setStep("error")
            }
        };

        fetchRoom();
    }, [isLoading, params.id, token, router]);

    return (
        <div className="h-screen w-screen overflow-hidden bg-white text-black">
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
