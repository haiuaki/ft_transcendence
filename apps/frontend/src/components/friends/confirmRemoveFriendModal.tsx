import { useState } from "react";
import CenterModalTemplate from "../TemplateModal/CenterModalTemplate"
import friendService, { Friend } from "@/src/services/friendService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ConfirmRemoveFriendModalProps {
    user: Friend,
    onClose: () => void;
    token: string,
    onSuccess: () => void;
}

const ConfirmRemoveFriendModal = ({ onClose, user, token, onSuccess }: ConfirmRemoveFriendModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const handleRemoveFriend = async () => {
        try {
            setIsLoading(true);
            const response = await friendService.remove(token, user.username)
            toast.success(response)
            onSuccess();
            onClose()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to remove friend")
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <CenterModalTemplate onClose={onClose} className="flex flex-col gap-5 rounded-2xl text-black w-full max-w-[500px] bg-white p-7" overlay="bg-black/20">
            <h1 className="text-2xl font-semibold">Remove {user.username}</h1>
            <div className="flex items-center gap-2 w-full ring-1 ring-[#dedede] rounded-md p-2">
                <img src={user.avatar_url || "/img/avatar.jpg"} alt={user.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                <p>{user.username}</p>
            </div>
            <div className="flex items-center justify-end gap-2">
                <div className="cursor-pointer flex items-center gap-2 ring-1 ring-[#dedede] p-2 text-sm rounded-md font-semibold" onClick={onClose}>
                    <p>Cancel</p>
                </div>
                <button className="cursor-pointer flex items-center gap-2 text-white bg-black p-2 text-sm rounded-md font-semibold" onClick={handleRemoveFriend}>
                    {isLoading && <Loader2 className="animate-spin" size={16} />}
                    <p>Remove</p>
                </button>
            </div>
        </CenterModalTemplate>
    )
}

export default ConfirmRemoveFriendModal;