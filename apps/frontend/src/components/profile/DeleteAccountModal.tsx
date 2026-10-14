import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/src/context/AuthContext";
import InputField from "../InputField";
import CenterModalTemplate from "../TemplateModal/CenterModalTemplate";

interface DeleteAccountModalProps {
    onClose: () => void,
}

const DeleteAccountModal = ({ onClose }: DeleteAccountModalProps) => {
    const { token, user, deleteProfile } = useAuth();
    const [confirmation, setConfirmation] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

    const username = user?.username ?? "";
    const isConfirmed = confirmation.trim().toLowerCase() === username.toLowerCase();

    const confirm = async () => {
        if (isLoading || !token || !isConfirmed) return;
        try {
            setIsLoading(true);
            await deleteProfile(token, confirmation.trim());
            toast.success("Your account has been deleted.");
            router.replace("/");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete account.");
            setIsLoading(false);
        }
    };

    return (
        <CenterModalTemplate onClose={onClose} className="text-black bg-white p-5 rounded-xl w-full max-w-[500px]" style={{}} overlay="bg-black/10">
            <div className="flex items-center justify-end">
                <div className="cursor-pointer p-1 hover:bg-black/5 rounded-full" onClick={onClose}>
                    <X size={16} />
                </div>
            </div>
            <div className="mx-auto max-w-[350px] w-full flex flex-col gap-5">
                <div className="text-center">
                    <p className="font-semibold">Delete your account</p>
                    <p className="mt-1 text-sm text-black/60">
                        This permanently erases your profile, messages, friends, rooms and activity. It cannot be undone.
                    </p>
                </div>

                <div className="w-full flex flex-col gap-4">
                    <InputField title={`Type "${username}" to confirm`} placeholder={username} value={confirmation} maxLength={30} type="text"
                        onChange={(e) => setConfirmation(e.target.value)} />
                    <button
                        disabled={isLoading || !isConfirmed}
                        className="cursor-pointer flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed p-2 rounded-md text-white"
                        onClick={confirm}
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        <p>Delete my account</p>
                    </button>
                </div>
            </div>
        </CenterModalTemplate>
    )
}

export default DeleteAccountModal;
