import { Loader2, Trash, X } from "lucide-react";
import InputField from "../InputField";
import userService from "@/src/services/userService";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import CenterModalTemplate from "../TemplateModal/CenterModalTemplate";
import Avatar, { DEFAULT_AVATAR } from "../Avatar";
import { USERNAME_REGEX, USERNAME_RULE } from "@/src/lib/validation";

interface EditProfileModalProps {
    onClose: () => void,
}

const AVATAR_SIZE = 256;
const MAX_AVATAR_LENGTH = 200 * 1024;

const fileToAvatarDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const side = Math.min(img.width, img.height);
            const canvas = document.createElement("canvas");
            canvas.width = AVATAR_SIZE;
            canvas.height = AVATAR_SIZE;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Unable to process the image."));
            ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Unable to read this image."));
        };
        img.src = objectUrl;
    });

const EditProfileModal = ({ onClose }: EditProfileModalProps) => {
    const { user, token, profile } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [username, setUsername] = useState<string>(user?.username ?? "");
    const [newAvatar, setNewAvatar] = useState<string | null>(null);
    const [avatarRemoved, setAvatarRemoved] = useState<boolean>(false);

    const currentAvatar = user?.avatar_url || DEFAULT_AVATAR;
    const avatarSrc = newAvatar ?? (avatarRemoved ? DEFAULT_AVATAR : currentAvatar);

    const trimmedUsername = username.trim();
    const usernameChanged = trimmedUsername !== user?.username;
    const avatarChanged = avatarSrc !== currentAvatar;

    const updateProfile = async () => {
        if (!token) return toast.error("Your session has expired. Please log in again.");
        if (usernameChanged && !USERNAME_REGEX.test(trimmedUsername))
            return toast.error(USERNAME_RULE);
        try {
            setIsLoading(true);
            await userService.edit(token, {
                ...(usernameChanged && { username: trimmedUsername }), ...(avatarChanged && { avatar_url: avatarSrc }),
            });
            await profile(token);
            toast.success("Profile updated successfully.");
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to update your profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const onAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) return toast.error("Please select a valid image file.");
        if (file.size > 5 * 1024 * 1024) return toast.error("The image must be smaller than 5 MB.");
        try {
            const dataUrl = await fileToAvatarDataUrl(file);
            if (dataUrl.length > MAX_AVATAR_LENGTH) return toast.error("This image is too large, please choose another one.");
            setNewAvatar(dataUrl);
            setAvatarRemoved(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to read this image.");
        }
    };

    return (
        <CenterModalTemplate onClose={onClose} className="text-black bg-white p-5 rounded-xl w-full max-w-[500px]" style={{}} overlay="bg-black/10">
            <div className="flex items-center justify-end">
                <div className="cursor-pointer p-1 hover:bg-black/5 rounded-full" onClick={onClose}>
                    <X size={16} />
                </div>
            </div>
            <div className="mx-auto max-w-[350px] w-full">

                <div className="flex flex-col gap-10 justify-center items-center">
                    <div className="relative size-35 shrink-0">
                        <label
                            htmlFor="avatar-upload"
                            className="group relative block size-full cursor-pointer overflow-hidden rounded-full"
                        >
                            <Avatar
                                fill
                                alt="Avatar"
                                src={avatarSrc}
                                className="object-cover"
                                sizes="140px"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                        </label>

                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={onAvatarSelected}
                        />

                        <button
                            type="button"
                            aria-label="Supprimer l’avatar"
                            className="cursor-pointer absolute bottom-1.5 right-1.5 z-10 rounded-full bg-white p-1.5 shadow-md transition-transform hover:bg-white/90"
                            onClick={() => {
                                setNewAvatar(null);
                                setAvatarRemoved(true);
                            }}
                        >
                            <Trash size={14} />
                        </button>
                    </div>
                    <div className="w-full flex flex-col gap-4">
                        <InputField title="Username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} type="text" />
                        <button disabled={(!usernameChanged && !avatarChanged) || isLoading} className="cursor-pointer flex items-center justify-center gap-2 bg-black hover:bg-black/80 disabled:bg-black/80 p-2 rounded-md text-white" onClick={updateProfile}>
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            <p>Update profile</p>
                        </button>
                    </div>
                </div>
            </div>
        </CenterModalTemplate>
    )
}

export default EditProfileModal;
