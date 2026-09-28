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

interface SignUpViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const SignUpView = ({ onNextStep, authFormData, setAuthFormData }: SignUpViewProps) => {
    const [error, setError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const colors = themeColors;
    return (
        <div className="flex flex-col gap-6">
            <p className="text-3xl font-semibold text-center" style={{color: colors.text}}>Create an account</p>
            <div className="flex flex-col gap-2">
                <InputField
                    placeholder="Enter an email"
                    type="email"
                    onChange={(e: any) => {
                        setAuthFormData({ ...authFormData, email: (e.target.value) })
                        setError(false)
                    }}
                    value={authFormData.email}
                />
                {error && <p className="text-xs text-red-400 pl-3">Email is not valid.</p>}
            </div>
            <ButtonAuth disabled={isLoading} text={"Continue"} textAction={"Continuing..."} isLoading={isLoading} onPress={async() => {
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
            }/>
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 w-full h-[1px] bg-linear-to-l from-[#ebebeb] to-transparent" />
                <p className="text-xs text-medium text-black/60">OR</p>
                <div className="flex-1 w-full h-[1px] bg-linear-to-r from-[#ebebeb] to-transparent" />
            </div>

            <div className="flex items-center justify-center gap-4">
                <div className="select-none flex items-center justify-center cursor-pointer ring-1 rounded-xl w-12 h-12 hover:ring-2 active:ring-1 active:ring-black/30 transition-all duration-200">
                    <FcGoogle />
                </div>
                <div className="select-none flex items-center justify-center cursor-pointer ring-1 rounded-xl w-12 h-12 hover:ring-2 active:ring-1 active:ring-black/30 transition-all duration-200">
                    <FaGithub color="black"/>
                </div>
                <div className="select-none flex items-center justify-center cursor-pointer ring-1 rounded-xl w-12 h-12 hover:ring-2 active:ring-1 active:ring-black/30 transition-all duration-200">
                    <Image src={"/img/42-logo.png"} alt="42" width={42} height={42}/>
                </div>
            </div>
            <p className="text-sm text-center text-black/60">By continuing, you agree to our <Link className="font-medium text-black cursor-pointer" href={"/privacy-policy"} target="_blank">privacy policy</Link></p>
        </div>
    )
}

export default SignUpView;