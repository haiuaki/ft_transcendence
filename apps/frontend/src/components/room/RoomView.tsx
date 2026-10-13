import { useAuth } from "@/src/context/AuthContext";
import roomService from "@/src/services/roomService";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "@/src/context/SocketContext";
import ThreeScene from "../3D/ThreeScene";

const RoomView = ({ roomId }: { roomId: string }) => {
    const { token } = useAuth();
    const router = useRouter();
    const { isConnected } = useSocket();
    const wasConnectedRef = useRef(false);

    useEffect(() => {
        if (!isConnected) return;
        if (wasConnectedRef.current && token)
            roomService.join(token, roomId, undefined).catch(() => { });
        wasConnectedRef.current = true;
    }, [isConnected, token, roomId]);

    const handleLeave = useCallback(async () => {
        if (token) {
            try {
                await roomService.leave(token, roomId);
            } catch { }
        }
        router.push("/rooms");
    }, [token, roomId, router]);

    return (
        <div className="w-full h-full relative">
            <ThreeScene roomId={roomId || null} onLeave={handleLeave}/>
        </div>
    )
}

export default RoomView;