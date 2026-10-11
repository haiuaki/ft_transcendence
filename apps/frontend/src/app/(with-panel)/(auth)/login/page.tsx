"use client"

import { useAuth } from "@/src/context/AuthContext";
import InputField from "@/src/components/InputField";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, Suspense, useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

interface AuthFormData {
  email: string,
  password: string,
}

function LogInContent() {
  const [authFormData, setAuthFormData] = useState<AuthFormData>({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false);
  const { login, completeTwoFactor } = useAuth();
  const searchParams = useSearchParams();
  const [tempToken, setTempToken] = useState<string | null>(searchParams.get("two_factor_token"));
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const oauth = [
    { icon: FcGoogle, text: "Continue with Google", href: "/api/oauth/google/login" },
    { icon: "/img/42-logo.png", text: "Continue with 42", href: "/api/oauth/42/login" },
    { icon: FaGithub, text: "Continue with Github", href: "/api/oauth/github/login" },
  ]

  const inputs = [
    { title: "Email", placeholder: "", maxLength: undefined, isPassword: false, onChange: (e: ChangeEvent<HTMLInputElement>) => setAuthFormData({ ...authFormData, email: e.target.value }), value: authFormData.email },
    { title: "Password", placeholder: "", maxLength: undefined, isPassword: true, onChange: (e: ChangeEvent<HTMLInputElement>) => setAuthFormData({ ...authFormData, password: e.target.value }), value: authFormData.password },
  ]

  const submitTwoFactor = async () => {
    if (!tempToken || isLoading) return;
    try {
      setIsLoading(true);
      setError(null);
      await completeTwoFactor(tempToken, twoFactorCode);
      router.push("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid 2FA code.";
      setError(message);
      if (/expired|too many/i.test(message)) {
        setTempToken(null);
        setTwoFactorCode("");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (tempToken) return (
    <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 items-center w-full h-full p-5 text-black">
      <h1 className="text-3xl font-semibold">Two-factor authentication</h1>
      <div className="flex flex-col gap-5 max-w-[400px] w-full">
        <p className="text-sm text-black/60 text-center">Enter the 6-digit code from your authenticator app.</p>
        <InputField title="Authentication code" placeholder="123456" maxLength={6} value={twoFactorCode}
          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))} />
        {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
        <button
          disabled={isLoading || twoFactorCode.length !== 6}
          className="select-none w-full flex items-center gap-2 justify-center p-2 rounded-md cursor-pointer bg-black hover:bg-black/85 disabled:bg-black/80 disabled:cursor-not-allowed text-white"
          onClick={submitTwoFactor}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : null}
          <p className="font-medium text-md">Verify</p>
        </button>
        <button className="text-center text-sm cursor-pointer font-semibold" onClick={() => { setTempToken(null); setTwoFactorCode(""); setError(null); }}>
          Back to log in
        </button>
      </div>
    </div>
  );

  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 items-center w-full h-full p-5 text-black">
    <h1 className="text-3xl font-semibold">Log in</h1>
    <div className="flex flex-col gap-5 max-w-[400px] w-full">
      <div className="flex flex-col gap-4 w-full">
        {oauth.map((item, idx) => {
          return (
            <a key={idx} href={item.href} className="w-full h-10 flex items-center justify-center gap-2 ring-1 ring-[#dedede] hover:bg-black/3 rounded-md ">
              {typeof item.icon === "string" ? <Image src={"/img/42.png"} alt="42" width={32} height={32} /> : <item.icon size={16} />}
              <p className="text-sm font-semibold">{item.text}</p>
            </a>
          )
        })}
      </div>
      <div className="h-[0.5px] w-full bg-[#dedede]" />
      <div className="flex flex-col gap-5">
        {inputs.map((item, idx) => {
          return <InputField key={idx} title={item.title} maxLength={item.maxLength} value={item.value} onChange={item.onChange} type={item.isPassword ? "password" : "text"} />
        })}
      </div>
      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
      <button
        disabled={isLoading}
        className={`select-none w-full flex items-center gap-2 justify-center p-2 rounded-md cursor-pointer ${isLoading ? "bg-black/80" : "bg-black hover:bg-black/85 active:bg-black/90 active:scale-99"} text-white `}
        onClick={async () => {
          try {
            setIsLoading(true);
            setError(null);
            const result = await login(authFormData.email, authFormData.password)
            if (result.twoFactorRequired) {
              setTempToken(result.tempToken);
              return;
            }
            router.push("/")
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
      <p className="text-center text-sm">Don&apos;t have an account? <Link href={"/signup"} className="cursor-pointer font-semibold">Sign up</Link></p>
    </div>
  </div>;
}

export default function LogIn() {
  return (
    <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
      <LogInContent />
    </Suspense>
  );
}
