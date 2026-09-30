import Link from "next/link";
import { useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import z from "zod";
import { AuthFormData, ButtonAuth, InputField, SetAuthFormData, StepAuthView } from "./AuthModal";
import { themeColors } from "@/src/lib/themeColors";
import Image from "next/image";
import { Info } from "lucide-react";

interface SignUpViewProps {
    onNextStep: (view: StepAuthView) => void;
    authFormData: AuthFormData;
    setAuthFormData: SetAuthFormData;
}

const SignUpView = ({ onNextStep, authFormData, setAuthFormData }: SignUpViewProps) => {
    const [error, setError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const colors = themeColors;
    const addEmail = () => {
        try {
            setIsLoading(true);
            const emailResult = z.email("").safeParse(authFormData.email);
            if (!emailResult.success) return setError(true);
            onNextStep("create_username");
        }
        catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false)
        }

    }
    return (
        <div className={`flex flex-col gap-6`}>
            <p className="text-3xl font-semibold text-center">Create an account</p>
            <div className="flex flex-col gap-2">
                <InputField
                    placeholder="Enter an email"
                    type="email"
                    onChange={(e) => {
                        setError(false)
                        setAuthFormData({ ...authFormData, email: (e.target.value) })
                    }}
                    value={authFormData.email}
                    error={error}
                    onPress={addEmail}
                />
                {(error) && <div className="flex items-center gap-2">
                    <Info size={14} color="red" />
                    <p className="text-red-500 text-sm font-semibold">Invalid email.</p>
                </div>
                }
            </div>
            <ButtonAuth disabled={isLoading} text={"Continue"} textAction={"Continuing..."} isLoading={isLoading} onPress={addEmail} />
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 w-full h-[1px] bg-linear-to-l from-[#ebebeb] to-transparent" />
                <p className={`text-xs text-medium ${colors.textSecondary}`}>OR</p>
                <div className="flex-1 w-full h-[1px] bg-linear-to-r from-[#ebebeb] to-transparent" />
            </div>

            <div className="flex items-center justify-center gap-4">
                <div onClick={() => window.location.href = "/api/oauth/google/login"} className="select-none flex items-center justify-center cursor-pointer ring-1 ring-black/10 rounded-xl w-12 h-12 hover:ring-2 active:ring-1 active:ring-black/30 transition-all duration-200">
                    <FcGoogle />
                </div>
                <div onClick={() => window.location.href = "/api/oauth/github/login"} className="select-none flex items-center justify-center cursor-pointer ring-1 ring-black/10 rounded-xl w-12 h-12 hover:ring-2 active:ring-1 active:ring-black/30 transition-all duration-200">
                    <FaGithub color="black" />
                </div>
                <div onClick={() => window.location.href = "/api/oauth/42/login"} className="select-none flex items-center justify-center cursor-pointer ring-1 ring-black/10 rounded-xl w-12 h-12 hover:ring-2 active:ring-1 active:ring-black/30 transition-all duration-200">
                    <Image src={"/img/42-logo.png"} alt="42" width={42} height={42} />
                </div>
            </div>
            <p className={`text-sm text-center ${colors.textSecondary}`}>By continuing, you agree to our <Link className="font-medium text-black cursor-pointer" href={"/privacy-policy"} target="_blank">privacy policy</Link></p>
        </div>
    )
}

export default SignUpView;
