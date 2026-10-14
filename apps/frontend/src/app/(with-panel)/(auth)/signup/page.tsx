"use client"

import { themeColors } from "@/src/lib/themeColors";
import userService from "@/src/services/userService";
import { Check, Loader2, MailCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import InputField from "@/src/components/InputField";

interface AuthFormData {
  email: string,
  username: string,
  password: string,
}

export default function SignUp() {
  const [authFormData, setAuthFormData] = useState<AuthFormData>({ email: "", username: "", password: "" })
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = themeColors;
  const oauth = [
    { icon: FcGoogle, text: "Continue with Google", href: "/api/oauth/google/login" },
    { icon: "/img/42-logo.png", text: "Continue with 42", href: "/api/oauth/42/login" },
    { icon: FaGithub, text: "Continue with Github", href: "/api/oauth/github/login" },
  ]

  const inputs = [
    { title: "Email", placeholder: "", maxLength: undefined, isPassword: false, onChange: (e: ChangeEvent<HTMLInputElement>) => setAuthFormData({ ...authFormData, email: e.target.value }), value: authFormData.email },
    { title: "Username", placeholder: "", maxLength: 30, isPassword: false, onChange: (e: ChangeEvent<HTMLInputElement>) => setAuthFormData({ ...authFormData, username: e.target.value }), value: authFormData.username },
    { title: "Password", placeholder: "", maxLength: undefined, isPassword: true, onChange: (e: ChangeEvent<HTMLInputElement>) => setAuthFormData({ ...authFormData, password: e.target.value }), value: authFormData.password },
  ]

  const passwordConditions = [
    { isValid: authFormData.password.length >= 10, text: "10 characters minimum" },
    { isValid: /[^a-zA-Z0-9]/.test(authFormData.password), text: "1 special character" },
    { isValid: /[0-9]/.test(authFormData.password), text: "1 number" },
    { isValid: authFormData.password.trim().length > 0 && authFormData.password.length == authFormData.password.trim().length, text: "No leading or trailing whitespace" },
  ]

  const createAccount = async () => {
    if (passwordConditions.some((item) => !item.isValid))
      return;
    try {
      setIsLoading(true)
      await userService.signup(authFormData.email, authFormData.password, authFormData.username)
      setAuthFormData({email: "", password: "", username: ""})
      toast.success("Account created!", {
        description: `A verification email has been sent to ${authFormData.email}.`,
        icon: <MailCheck size={20} />,
        duration: 7000,
      });
      <p className={`text-sm text-center ${colors.textSecondary}`}>By continuing, you agree to our <Link className="font-medium text-black cursor-pointer" href={"/terms-of-service"} target="_blank">terms of service</Link> and <Link className="font-medium text-black cursor-pointer" href={"/privacy-policy"} target="_blank">privacy policy</Link></p>
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create user")
    } finally {
      setIsLoading(false);
    }
  }
  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 items-center w-full h-full p-5 text-black">
    <h1 className="text-3xl font-semibold">Sign up</h1>
    <div className="flex flex-col gap-5 max-w-[400px] w-full">
      <div className="flex flex-col gap-4 w-full">
        {oauth.map((item, idx) => {
          return (
            <a key={idx} href={item.href} className="w-full h-10 flex items-center justify-center gap-2 ring-1 ring-ui-line hover:bg-black/3 rounded-md ">
              {typeof item.icon === "string" ? <Image src={"/img/42.png"} alt="42" width={32} height={32} /> : <item.icon size={16} />}
              <p className="text-sm font-semibold">{item.text}</p>
            </a>
          )
        })}
      </div>
      <div className="h-[0.5px] w-full bg-ui-line" />
      <div className="flex flex-col gap-5">
        {inputs.map((item, idx) => {
          return <InputField key={idx} title={item.title} value={item.value} maxLength={item.maxLength} onChange={item.onChange} type={item.isPassword ? "password" : "text"}/>
        })}
      </div>
      {authFormData.password.trim().length > 0 && <div className="flex flex-col gap-1">
                <p className="text-sm text-black mb-1">The password must contains : </p>
                {passwordConditions.map((condition, idx) => {
                  return (
                    <div key={idx} className={`flex items-center gap-2 text-sm py-1 px-2 rounded-sm ${condition.isValid ? "text-[#1b6636] bg-[#e4f7eb] font-bold" : `${colors.textSecondary} font-semibold`}`}>
                      {condition.isValid && <Check size={12} />}
                      {condition.text}
                    </div>
                  )
                })}
              </div>}
      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
      <p className={`text-sm text-left ${colors.textSecondary}`}>By continuing, you agree to our <Link className="font-medium text-black cursor-pointer" href={"/terms-of-service"} target="_blank">terms of service</Link> and <Link className="font-medium text-black cursor-pointer" href={"/privacy-policy"} target="_blank">privacy policy</Link></p>
      <div className="flex flex-col gap-2">

      <button
        disabled={isLoading}
        className={`select-none w-full flex items-center gap-2 justify-center p-2 rounded-md cursor-pointer ${isLoading ? "bg-black/80" : "bg-black hover:bg-black/85 active:bg-black/90 active:scale-99"} text-white `}
        onClick={createAccount}
        >
        {isLoading ? <Loader2 className="animate-spin" /> : null}
        <p className="font-medium text-md"> {isLoading ? "Signing up" : "Sign up"}</p>
      </button>
      <p className="text-center text-sm">Already have an account? <Link href={"/login"} className="cursor-pointer font-semibold">Log in</Link></p>
        </div>
    </div>
  </div>;
}
