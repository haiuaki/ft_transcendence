import { useAuth } from "@/src/context/AuthContext";
import roomService from "@/src/services/roomService";
import { useEffect } from "react";
import ThreeScene from "../3D/ThreeScene";

const RoomView = ({ roomId }: { roomId: string }) => {
    const { token } = useAuth();

    useEffect(() => {
        const handlePageHide = () => roomService.leave(token || "", roomId);
        window.addEventListener("pagehide", handlePageHide);
        return () => window.removeEventListener("pagehide", handlePageHide);
    }, [token, roomId]);

    return (
        <div className="w-full h-full relative">
            <ThreeScene />
        </div>
    )
}

export default RoomView;