import userService from "@/src/services/userService";
import Link from "next/link";
import { useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { TbLoader2 } from "react-icons/tb";
import z from "zod";
import { AuthFormData, ButtonAuth, InputField } from "./AuthModal";
import { themeColors } from "@/src/lib/themeColors";
import Image from "next/image";

interface VerifyCodeProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const VerifyCode = ({ onNextStep, authFormData, setAuthFormData }: VerifyCodeProps) => {
    const [error, setError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const colors = themeColors;
    return (
        <div className="flex h-full min-h-0 flex-col gap-6">
            <div className="flex-1 flex flex-col gap-6 ">
                <div className="flex flex-col gap-2">
                    <p className="text-3xl font-bold text-center" style={{ color: colors.text }}>Check your inbox</p>
                    <p className={`text-base font-medium text-center ${colors.textSecondary}`}>We've sent a code to {authFormData.email}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <InputField
                        placeholder="Enter a six-digit code"
                        maxLength={6}
                        type="email"
                        onChange={(e: any) => {
                            setAuthFormData({ ...authFormData, code: (e.target.value) })
                            setError(false)
                        }}
                        value={authFormData.code}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <ButtonAuth disabled={isLoading || authFormData.code.length != 6} text={"Confirm"} textAction={"Verifying..."} isLoading={isLoading} onPress={async () => {
                    try {
                        setIsLoading(true);
                        onNextStep("create_username")
                    }
                    catch (e) {
                        console.log(e);
                    } finally {
                        setIsLoading(false)
                    }
                }
                } />
                <p className={`text-center text-sm font-medium ${colors.textSecondary}`}>Didn't receive the code?<Link className="cursor-pointer font-semibold text-black" href={"/privacy-policy"} target="_blank"> Resend a code</Link></p>
            </div>
        </div>
    )
}

export default VerifyCode;
