import { useState } from "react";
import { AuthFormData, ButtonAuth, InputField, SetAuthFormData } from "./AuthModal";
import { Check, Info, MailCheck } from "lucide-react";
import userService from "@/src/services/userService";
import { themeColors } from "@/src/lib/themeColors";
import { toast } from "sonner";

interface CreatePasswordViewProps {
    authFormData: AuthFormData;
    setAuthFormData: SetAuthFormData;
    onClose: () => void;
}


const CreatePasswordView = ({ authFormData, setAuthFormData, onClose }: CreatePasswordViewProps) => {

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const colors = themeColors;

    const createAccount = async () => {
        try {
            setIsLoading(true);
            await userService.signup(authFormData.email, authFormData.password, authFormData.username);
            onClose();
            toast.success("Account created!", {
                description: `A verification email has been sent to ${authFormData.email}.`,
                icon: <MailCheck size={20} />,
                duration: 7000,
            });

        } catch (e) {
            setErrorMessage(e instanceof Error ? e.message : "Unable to create account.")
        } finally {
            setIsLoading(false)
        }

    }
    return (
        <div className="flex flex-col h-full min-h-0 text-black">
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <p className="text-3xl font-semibold text-center">Create your password</p>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">

                        <InputField
                            autoFocus
                            placeholder="Enter a password"
                            type="password"
                            onChange={(e) => {
                                setErrorMessage(null);
                                setAuthFormData({ ...authFormData, password: e.target.value })
                            }}
                            onPress={createAccount}
                            value={authFormData.password}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-black mb-1">The password must contains : </p>
                        {passwordConditions.map((condition, idx) => {
                            return (
                                <div key={idx} className={`flex items-center gap-2 text-sm py-1 px-2 rounded-sm ${condition.isValid ? "text-[#1b6636] bg-[#e4f7eb] font-bold" : `${colors.textSecondary} font-semibold`}`}>
                                    {condition.isValid && <Check size={12} />}
                                    {condition.text}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            {errorMessage &&
                <div className="flex items-center gap-2 font-bold text-red-500 text-sm mb-2">
                    <Info size={14} />
                    <p>{errorMessage}</p>
                </div>
            }

            <div className="flex flex-col">
                <ButtonAuth
                    isLoading={isLoading}
                    disabled={isLoading || passwordConditions.some((item) => !item.isValid)}
                    text="Create account"
                    textAction="Creating account..."
                    onPress={createAccount}
                />
            </div>
        </div>
    )
}

export default CreatePasswordView;