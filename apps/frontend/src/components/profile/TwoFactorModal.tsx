import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/src/context/AuthContext";
import type { TwoFactorSetupResponse } from "@/src/services/twoFactorService";
import InputField from "../InputField";
import CenterModalTemplate from "../TemplateModal/CenterModalTemplate";

interface TwoFactorModalProps {
    mode: "enable" | "disable",
    onClose: () => void,
}

const TwoFactorModal = ({ mode, onClose }: TwoFactorModalProps) => {
    const { setupTwoFactor, enableTwoFactor, disableTwoFactor } = useAuth();
    const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
    const [code, setCode] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(mode === "enable");

    const hasStartedSetup = useRef<boolean>(false);

    useEffect(() => {
        if (mode !== "enable" || hasStartedSetup.current) return;
        hasStartedSetup.current = true;
        const startSetup = async () => {
            try {
                setSetup(await setupTwoFactor());
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to start two-factor setup.");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        startSetup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const confirm = async () => {
        if (isLoading) return;
        if (!/^\d{6}$/.test(code.trim()))
            return toast.error("Enter the 6-digit code from your authenticator app.");
        try {
            setIsLoading(true);
            if (mode === "enable")
                await enableTwoFactor(code);
            else
                await disableTwoFactor(code);
            toast.success(`Two-factor authentication ${mode === "enable" ? "enabled" : "disabled"}.`);
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Invalid code.");
        } finally {
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
            <div className="mx-auto max-w-[350px] w-full flex flex-col gap-5 items-center">
                <div className="text-center">
                    <p className="font-semibold">
                        {mode === "enable" ? "Enable two-factor authentication" : "Disable two-factor authentication"}
                    </p>
                    <p className="mt-1 text-sm text-black/60">
                        {mode === "enable"
                            ? "Scan the QR code with your authenticator app, then enter the 6-digit code."
                            : "Enter a current 6-digit code from your authenticator app to confirm."}
                    </p>
                </div>

                {mode === "enable" && (
                    setup ? (
                        <div className="flex flex-col items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={setup.qr_code} alt="2FA QR code" className="size-44" />
                            <p className="text-xs text-black/60">Can&apos;t scan? Enter this key manually:</p>
                            <p className="text-xs font-mono break-all text-center select-all">{setup.secret}</p>
                        </div>
                    ) : (
                        <Loader2 className="animate-spin" size={28} />
                    )
                )}

                <div className="w-full flex flex-col gap-4">
                    <InputField title="Authentication code" placeholder="123456" value={code} maxLength={6} type="text"
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                    <button
                        disabled={isLoading || (mode === "enable" && !setup) || code.length !== 6}
                        className="cursor-pointer flex items-center justify-center gap-2 bg-black hover:bg-black/80 disabled:bg-black/80 disabled:cursor-not-allowed p-2 rounded-md text-white"
                        onClick={confirm}
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        <p>{mode === "enable" ? "Enable" : "Disable"}</p>
                    </button>
                </div>
            </div>
        </CenterModalTemplate>
    )
}

export default TwoFactorModal;
