import { useState } from "react";
import { AuthFormData, InputField } from "./authModal";
import { Loader2, CheckCircle, Check, Circle } from "lucide-react";

interface CreatePasswordViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const CreatePasswordView = ({ onNextStep, authFormData, setAuthFormData }: CreatePasswordViewProps) => {
    const [password, setPassword] = useState<string>("");
    const [confirmedPassword, setConfirmedPassword] = useState<string>("");

    const passwordConditions = [
        { isValid: password.length >= 10, text: "10 characters minimum" },
        { isValid: /[^a-zA-Z0-9]/.test(password), text: "1 special character" },
        { isValid: /[0-9]/.test(password), text: "1 number" },
        { isValid: password == confirmedPassword && password.trim().length > 0, text: "Password match" },
    ]

    const [loading, setLoading] = useState<boolean>(false);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <p className="text-3xl font-medium text-center">Create your password</p>
                <p className="text-sm text-center">Create a strong password to keep your account secure.</p>
            </div>
            <div className="flex flex-col gap-4">
                <InputField
                    autoFocus
                    title="Password"
                    placeholder="Enter a password"
                    type="password"
                    onChange={(e: any) => {
                        setPassword(e.target.value)
                    }}
                    value={password}
                />
                <InputField
                    title="Confirm password"
                    placeholder="Confirm your password"
                    type="password"
                    onChange={(e: any) => setConfirmedPassword(e.target.value)}
                    value={confirmedPassword}
                />
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-sm text-white/50 mb-1">The password must contains : </p>
                {passwordConditions.map((condition, idx) => {
                    return (
                        <div key={idx} className={`flex items-center gap-2 text-sm py-1 px-2 rounded-sm ${condition.isValid ? "text-green-400" : ""}`}>
                            {condition.isValid && <Check size={12} />}
                            <p className="font-semibold">{condition.text}</p>
                        </div>
                    )
                })}
            </div>
            <button disabled={loading || confirmedPassword === password} className={`cursor-pointer w-full flex items-center gap-2 justify-center p-3 rounded-full ${loading || authFormData.username.trim().length == 0 ? "bg-[#D0D0D0]" : "bg-[#ededed] hover:bg-[#D5D5D5] active:bg-[#D0D0D0]"} text-black font-medium`}
                onClick={async () => {
                }}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                <p> {loading ? "Creating account..." : "Create account"}</p>
            </button>

        </div>
    )
}

export default CreatePasswordView;