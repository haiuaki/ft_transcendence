import { AnimatePresence } from "motion/react";
import CenterModalTemplate from "../templateModal/centerModalTemplate";
import colorTheme from "@/src/lib/color";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { z } from "zod";
import Link from "next/link";

interface AuthModalProps {
    onClose: any;
    isOpen: any;
    view?: "signup" | "login";
}

interface InputFieldProps {
    title: string,
    placeholder: string,
    type?: string,
    onChange: any,
    value: string,
}

const InputField = ({ title, placeholder, type = "text", onChange, value }: InputFieldProps) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    return (
        <div className="w-full flex flex-col items-start gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <div className="flex items-center justify-between w-full border rounded-full border-[0.5px] border-[#565655] focus-within:ring-[1px] transition-all duration-200">
                <input value={value} placeholder={placeholder} type={type == "password" && showPassword ? "text" : type} className="w-full outline-none p-3" onChange={onChange} />
                {type == "password" && <div onClick={() => setShowPassword(!showPassword)} className="mr-3">
                    {showPassword ? <FaRegEyeSlash size={16} /> : <FaRegEye size={16} />}
                </div>}
            </div>
        </div>
    )
}

const HomeAuthView = () => {
    const [badEmail, setBadEmail] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    return (
        <div className="flex flex-col gap-6">
            <p className="text-3xl font-medium text-center">Log in or sign up</p>
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
            <div className="flex flex-col gap-2">
                <InputField title="Email" placeholder="Enter an email" type="email" onChange={(e) => {
                    setEmail(e.target.value)
                    setBadEmail(false)
                    }} 
                    value={email}/>
                {badEmail && <p className="text-xs text-red-500 pl-3">Email is not valid.</p>}
            </div>
            <button className="cursor-pointer w-full flex items-center justify-center p-3 rounded-full bg-[#ededed] hover:bg-[#D5D5D5] active:bg-[#D0D0D0] text-black font-medium"
            onClick={() => {
                const zod = z.email("").safeParse(email);
                if (!zod.success) return setBadEmail(true)
            }}>
                <p>Continue</p>
            </button>
            <p className="text-sm text-center text-white/70">By continuing, you agree to our <Link className="underline text-white cursor-pointer" href={"/privacy-policy"} target="_blank">privacy policy</Link></p>

        </div>
    )
}

export const AuthModal = ({ onClose, isOpen }: AuthModalProps) => {
    const [authView, setAuthView] = useState<"homeAuthView">("homeAuthView")
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <CenterModalTemplate onClose={onClose} className={"w-full max-w-[450px] p-7 rounded-xl"} style={{ backgroundColor: "#222220" }} overlay="bg-black/25">
            {authView == "homeAuthView" && <HomeAuthView />}
            </CenterModalTemplate>
        </AnimatePresence>
    )
}