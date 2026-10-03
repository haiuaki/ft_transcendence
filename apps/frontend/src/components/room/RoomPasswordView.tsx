import { useAuth } from "@/src/context/AuthContext";
import roomService from "@/src/services/roomService";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { IoLockClosed } from "react-icons/io5";
import { toast } from "sonner";
import type { SubmitEvent } from "react";

interface RoomPasswordViewProps {
    roomId: string;
    onSuccess: () => void;
}

const RoomPasswordView = ({ roomId, onSuccess }: RoomPasswordViewProps) => {
    const { token } = useAuth();
    const [password, setPassword] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const handlePasswordSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedPassword = password.trim();

        if (!trimmedPassword || isSubmitting) return;

        setError("");
        setIsSubmitting(true);

        try {
            await roomService.join(token || "", roomId, trimmedPassword);
            toast.success("Successfully joined the room.");
            onSuccess();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Incorrect password. Please try again.");
        } finally {
            setIsSubmitting(false)
        }
    };


    return (
        <div className="h-full flex flex-col gap-2 items-center justify-center">
            <form onSubmit={handlePasswordSubmit} className="flex flex-col items-center justify-center gap-2 w-full max-w-[300px]">
                <IoLockClosed size={38} />
                <div className="text-center">
                    <p className="font-semibold">Private room</p>
                    <p className="mt-1 text-sm text-black/60">Enter the password to join this room.</p>
                </div>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Room password"
                    className="w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-black"
                />
                {error && <p className="w-full text-sm text-red-500">{error}</p>}
                <button
                    type="submit"
                    disabled={!password.trim() || isSubmitting}
                    className="w-full flex justify-center items-center gap-2 cursor-pointer rounded-md bg-black px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <p>{isSubmitting ? "Joining room" : "Join room"}</p>
                </button>

            </form>
        </div>

    )
}

export default RoomPasswordView;