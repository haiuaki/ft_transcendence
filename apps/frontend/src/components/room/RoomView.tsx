import { useAuth } from "@/src/context/AuthContext";
import roomService from "@/src/services/roomService";
import { useEffect, useRef } from "react";
import { useSocket } from "@/src/context/SocketContext";
import ThreeScene from "../3D/ThreeScene";

const RoomView = ({ roomId }: { roomId: string }) => {
    const { token } = useAuth();
    const { isConnected } = useSocket();
    const wasConnectedRef = useRef(false);

    useEffect(() => {
        if (!isConnected) return;
        if (wasConnectedRef.current && token)
            roomService.join(token, roomId, undefined).catch(() => { });
        wasConnectedRef.current = true;
    }, [isConnected, token, roomId]);

    return (
        <div className="w-full h-full relative">
            <ThreeScene roomId={roomId || null}/>
        </div>
    )
}

export default RoomView;