import { useState } from "react";
import { AuthFormData, ButtonAuth, InputField } from "./authModal";
import { Loader2, CheckCircle, Check, Circle } from "lucide-react";
import userService from "@/src/service/userService";

interface CreatePasswordViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const CreatePasswordView = ({ onNextStep, authFormData, setAuthFormData }: CreatePasswordViewProps) => {

    const passwordConditions = [
        { isValid: authFormData.password.length >= 10, text: "10 characters minimum" },
        { isValid: /[^a-zA-Z0-9]/.test(authFormData.password), text: "1 special character" },
        { isValid: /[0-9]/.test(authFormData.password), text: "1 number" },
        { isValid: authFormData.password.trim().length > 0 && authFormData.password.length == authFormData.password.trim().length, text: "No leading or trailing whitespace" },
    ]

    const [isLoading, setIsLoading] = useState<boolean>(false);

    return (
        <div className="flex flex-col h-full min-h-0 text-black">
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <p className="text-3xl font-semibold text-center">Create your password</p>
                </div>
                <div className="flex flex-col gap-4">
                    <InputField
                        autoFocus
                        placeholder="Enter a password"
                        type="password"
                        onChange={(e: any) => {
                            setAuthFormData({...authFormData, password: e.target.value})
                        }}
                        value={authFormData.password}
                    />
                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-black mb-1">The password must contains : </p>
                        {passwordConditions.map((condition, idx) => {
                            return (
                                <div key={idx} className={`flex items-center gap-2 text-sm py-1 px-2 rounded-sm ${condition.isValid ? "text-[#1b6636] bg-[#e4f7eb] font-bold" : "text-black/60 font-semibold"}`}>
                                    {condition.isValid && <Check size={12} />}
                                    {condition.text}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <ButtonAuth
                isLoading={isLoading}
                disabled={isLoading}
                text="Create account"
                textAction="Creating account..."
                onPress={async () => {
                        try {
                            setIsLoading(true);
                            await userService.signup(authFormData.email, authFormData.password, authFormData.username);
                            console.log("ok")
                        } catch (e) {
                            console.log(e + "\n");
                        } finally {
                            setIsLoading(false)
                        }
                    }}
                /> 
            </div>
        </div>
    )
}

export default CreatePasswordView;