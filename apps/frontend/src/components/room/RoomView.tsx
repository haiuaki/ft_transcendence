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

    // The backend stands the user up from every room whenever ANY of their sockets closes
    // (e.g. reloading another tab). Sit back down if that happens, unless another tab took another room.
    useEffect(() => {
        if (!token) return
        let supersededByOtherTab = false;
        const channel = new BroadcastChannel("room-presence");
        channel.onmessage = (event) => { if (event.data !== roomId) supersededByOtherTab = true; };
        channel.postMessage(roomId);

        const interval = setInterval(async () => {
            if (supersededByOtherTab) return;
            try {
                if (!(await roomService.isSeated(token, roomId)))
                    await roomService.join(token, roomId, undefined);
            } catch { }
        }, 3000);
        return () => {
            clearInterval(interval);
            channel.close();
        };
    }, [token, roomId]);

    return (
        <div className="w-full h-full relative">
            <ThreeScene />
        </div>
    )
}

export default RoomView;