import { themeColors } from "@/src/lib/themeColors";
import { AuthFormData } from "./AuthModal";
import { Icon } from "@iconify/react";
import { Info } from "lucide-react";
import Link from "next/link";
import { PiMicrosoftOutlookLogoFill } from "react-icons/pi";

interface ConfirmAccountViewProps {
    authFormData: AuthFormData;
}


const ConfirmAccountView = ({ authFormData }: ConfirmAccountViewProps) => {
    const colors = themeColors
    return (
        <div className="flex flex-col justify-between h-full min-h-0 text-black">
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <p className="text-3xl font-semibold text-center">Confirmer votre Compte</p>
                        <p className={`text-center font-semibold text-sm ${colors.textSecondary}`}>
                            We’ve sent a verification link to{" "}
                            <span className="font-bold">{authFormData.email}</span>. Please check your
                            inbox and click the link to verify your account.
                        </p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-4">
                <a href={"https://mail.google.com/"} target="_blank" className="cursor-pointer flex items-center justify-center gap-2 ring-1 ring-black/60 rounded-md px-3 py-2">
                    <Icon icon="logos:google-gmail" width={20} />
                    <p className="text-sm font-semibold">Open Gmail</p>
                </a>
                <a href={"https://outlook.live.com/mail/"} target="_blank" className="cursor-pointer flex items-center justify-center gap-2 ring-1 ring-black/60 rounded-md px-3 py-2">
                    <Icon icon="thesvg-color:microsoft-outlook" width={20} />
                    <p className="text-sm font-semibold">Open Outlook</p>
                </a>
            </div>
        </div>
    )
}

export default ConfirmAccountView;