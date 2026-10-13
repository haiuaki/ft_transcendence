import { useAuth } from "@/src/context/AuthContext";
import roomService from "@/src/services/roomService";
import { useEffect } from "react";
import ThreeScene from "../3D/ThreeScene";

const RoomView = ({ roomId }: { roomId: string }) => {
    const { token } = useAuth();

    useEffect(() => {
        if (!token) return
        const leave = () => { roomService.leave(token, roomId).catch(() => { }); };

        window.addEventListener("pagehide", leave);
        window.addEventListener("popstate", leave);
        return () => {
            window.removeEventListener("pagehide", leave);
            window.removeEventListener("popstate", leave);
        };
    }, [token, roomId]);

    return (
        <div className="w-full h-full relative">
            <ThreeScene roomId={roomId} />
        </div>
    )
}

export default RoomView;