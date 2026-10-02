"use client"

import { useAuth } from "@/src/context/AuthContext";
import { themeColors } from "@/src/lib/themeColors";
import userService from "@/src/services/userService";
import { Check, Eye, EyeClosed, Loader2, MailCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

interface AuthFormData {
  email: string,
  password: string,
}

export default function LogIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [authFormData, setAuthFormData] = useState<AuthFormData>({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false);
  const {login} = useAuth();
  const [error, setError] = useState<string | null>(null);
  const colors = themeColors;
  const oauth = [
    { icon: FcGoogle, text: "Continue with Google", href: "/api/oauth/google/login" },
    { icon: "/img/42-logo.png", text: "Continue with 42", href: "/api/oauth/42/login" },
    { icon: FaGithub, text: "Continue with Github", href: "/api/oauth/github/login" },
  ]

  const inputs = [
    { title: "Email", placeholder: "", maxLength: undefined, isPassword: false, onChange: (e) => setAuthFormData({ ...authFormData, email: e.target.value }), value: authFormData.email },
    { title: "Password", placeholder: "", maxLength: undefined, isPassword: true, onChange: (e) => setAuthFormData({ ...authFormData, password: e.target.value }), value: authFormData.password },
  ]


  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 items-center w-full h-full p-5 text-black">
    <h1 className="text-3xl font-semibold">Log in</h1>
    <div className="flex flex-col gap-5 max-w-[400px] w-full">
      <div className="flex flex-col gap-4 w-full">
        {oauth.map((item, idx) => {
          return (
            <Link key={idx} href={item.href} className="w-full h-10 flex items-center justify-center gap-2 ring-1 ring-[#dedede] hover:bg-black/3 rounded-md ">
              {typeof item.icon === "string" ? <Image src={"/img/42.png"} alt="42" width={32} height={32} /> : <item.icon size={16} />}
              <p className="text-sm font-semibold">{item.text}</p>
            </Link>
          )
        })}
      </div>
      <div className="h-[0.5px] w-full bg-[#dedede]" />
      <div className="flex flex-col gap-5">
        {inputs.map((item, idx) => {
          return (
            <div key={idx} className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.maxLength != undefined && <p className={`text-xs ${colors.textSecondary}`}>{item.value.length}/{item.maxLength}</p>}
              </div>
              <div className="flex items-center justify-between gap-2 w-full ring-1 ring-[#dedede] focus-within:ring-black/80 rounded-md">
                <input placeholder={item.placeholder} maxLength={item.maxLength} onChange={(e) => {
                  setError(null);
                  item.onChange(e)
                  }} value={item.value} type={item.isPassword && !showPassword ? "password" : "text"} className="w-full pl-2 py-2 outline-none text-sm" />
                {item.isPassword && <div className="pr-2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <Eye size={12} /> : <EyeClosed size={12} />}
                </div>
                }
              </div>
            </div>
          )
        })}
      </div>
      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
      <button
        disabled={isLoading}
        className={`select-none w-full flex items-center gap-2 justify-center p-2 rounded-md cursor-pointer ${isLoading ? "bg-black/80" : "bg-black hover:bg-black/85 active:bg-black/90 active:scale-99"} text-white `}
        onClick={async () => {
          try {
            setIsLoading(true);
            await login(authFormData.email, authFormData.password)
            window.location.href = "/"
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to log in user");
          } finally {
            setIsLoading(false);
          }
        }}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : null}
        <p className="font-medium text-md"> {isLoading ? "loging in" : "Log in"}</p>
      </button>
      <p className="text-center text-sm">Haven't an account? <Link href={"/login"} className="cursor-pointer font-semibold">Sign up</Link></p>
    </div>
  </div>;
}
