import userService from "@/src/service/userService";
import Link from "next/link";
import { useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { TbLoader2 } from "react-icons/tb";
import z from "zod";
import { AuthFormData, InputField } from "./authModal";

interface HomeAuthViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const HomeAuthView = ({ onNextStep, authFormData, setAuthFormData }: HomeAuthViewProps) => {
    const [error, setError] = useState<"bad_email" | "wrong_password" | "length_code" | null>(null);
    const [step, setStep] = useState<"email" | "password" | "code">("email")
    const [loading, setLoading] = useState<boolean>(false);
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
            <p className="text-3xl font-medium text-center">Log in or sign up</p>
            <p className="text-sm text-center">Sign in to continue, or create an account to get started.</p>
            </div>
            <div className="flex flex-col gap-4">
                <div className="cursor-pointer w-full flex items-center justify-center gap-2 border-[0.5px] border-[#565655] rounded-full p-3 hover:bg-white/5 active:bg-white/10">
                    <FcGoogle />
                    <p className="">Continue with Google</p>
                </div>
                <div className="cursor-pointer w-full flex items-center justify-center gap-2 border-[0.5px] border-[#565655] rounded-full p-3 hover:bg-white/5 active:bg-white/10">
                    <FaGithub />
                    <p className="">Continue with Github</p>
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 w-full h-[0.5px] bg-linear-to-l from-[#565655] to-transparent" />
                <p className="text-sm text-white/70">OR</p>
                <div className="flex-1 w-full h-[0.5px] bg-linear-to-r from-[#565655] to-transparent" />
            </div>
            <div className="flex flex-col gap-4">
                <InputField
                    title="Email"
                    placeholder="Enter an email"
                    type="email"
                    onChange={(e: any) => {
                        setStep("email")
                        setAuthFormData({ ...authFormData, email: (e.target.value) })
                        setError(null)
                    }}
                    value={authFormData.email}
                />
                {step == "password" && <>
                    <InputField
                        title="Password"
                        placeholder="Enter a password"
                        type="password"
                        onChange={(e: any) => {
                            setAuthFormData({ ...authFormData, password: e.target.value })
                            setError(null)
                        }}
                        value={authFormData.password}
                    />
                    <p className="cursor-pointer text-sm text-right underline text-white/50 select-none" onClick={() => onNextStep("forgot_password")}>Forgot password ?</p>
                </>
                }
                {step == "code" && <InputField
                    title="Code"
                    placeholder="Enter a six-digit code"
                    type="text"
                    maxLength={6}
                    onChange={(e: any) => {
                        if (e.target.value < "0" && e.target.value > "9") return
                        setAuthFormData({ ...authFormData, code: e.target.value })
                        setError(null)
                    }}
                    value={authFormData.code}
                />
                }
                {error == "bad_email" && <p className="text-xs text-red-400 pl-3">Email is not valid.</p>}
                {error == "wrong_password" && <p className="text-xs text-red-400 pl-3">Wrong password.</p>}
                {error == "length_code" && <p className="text-xs text-red-400 pl-3">The verification code should be exactly 6 characters long.</p>}
            </div>
            <button disabled={loading || authFormData.email.trim().length == 0} className={`cursor-pointer w-full flex items-center gap-2 justify-center p-3 rounded-full ${loading || authFormData.email.trim().length == 0 ? "bg-[#D0D0D0]" : "bg-[#ededed] hover:bg-[#D5D5D5] active:bg-[#D0D0D0]"} text-black font-medium`}
                onClick={async () => {
                    if (step == "email") {
                        const emailResult = z.email("").safeParse(authFormData.email);
                        if (!emailResult.success) return setError("bad_email");
                        await userService.checkExistingUser(authFormData.email, setLoading);
                    }
                    if (step == "code") {
                        if (authFormData.code.length != 6) return setError("length_code")
                    }
                    if (step != "email") return onNextStep("create_username");
                    setStep("password")
                    setAuthFormData({ ...authFormData, code: "" })
                }}>
                {loading ? <TbLoader2 className="animate-spin" /> : null}
                <p> {loading ? "Continuing..." : "Continue"}</p>
            </button>
            <p className="text-sm text-center text-white/70">By continuing, you agree to our <Link className="underline text-white cursor-pointer" href={"/privacy-policy"} target="_blank">privacy policy</Link></p>
        </div>
    )
}

export default HomeAuthView;