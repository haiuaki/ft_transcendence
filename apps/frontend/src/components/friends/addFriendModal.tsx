import { useState } from "react";
import CenterModalTemplate from "../TemplateModal/CenterModalTemplate"
import friendService from "@/src/services/friendService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddFriendModalProps {
    token: string,
    onClose: () => void;
}
const AddFriendModal = ({ onClose, token }: AddFriendModalProps) => {
    const [username, setUsername] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const handleAddFriend = async () => {
        try {
            setIsLoading(true);
            const response = await friendService.add(token, username)
            toast.success(response)
            onClose()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add friend")
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <CenterModalTemplate onClose={onClose} className="flex flex-col gap-5 rounded-2xl text-black w-full max-w-[500px] bg-white p-7" overlay="bg-black/20">
            <h1 className="text-2xl font-semibold">Add a friend</h1>
            <div className="flex items-center justify-between gap-2 w-full ring-1 ring-[#dedede] focus-within:ring-black/80 rounded-md pl-2">
                <input placeholder={"Enter a username"} value={username} onChange={(e) => setUsername(e.target.value)} className="w-full py-2 outline-none text-sm" />
            </div>
            <div className="flex items-center justify-end gap-2">
                <div className="cursor-pointer flex items-center gap-2 ring-1 ring-[#dedede] p-2 text-sm rounded-md font-semibold" onClick={onClose}>
                    <p>Cancel</p>
                </div>
                <button disabled={isLoading || username.length < 1} className="cursor-pointer flex items-center gap-2 text-white bg-black disabled:bg-black/80 p-2 text-sm rounded-md font-semibold" onClick={handleAddFriend}>
                    {isLoading && <Loader2 className="animate-spin" size={16}/>}
                    <p>Add</p>
                </button>
            </div>
        </CenterModalTemplate>
    )
}

export default AddFriendModal;