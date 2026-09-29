"use client"

import userService from "@/src/services/userService";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const VerifyContent = () => {
    const params = useSearchParams();
    const token = params.get("token");
    const verificationRef = useRef(false);
    const [count, setCount] = useState<number>(10);
    const [status, setStatus] = useState<"loading" | "token_not_found" | "error" | "success">("loading");

    useEffect(() => {
        if (!token) return setStatus("token_not_found");
        if (verificationRef.current == true) return
        verificationRef.current = true;
        const verifyAccount = async () => {
            try {
                await userService.verify(token);
                setStatus("success");
            } catch (e) {
                setStatus("error")
                console.log(e)
            }
        }
        verifyAccount();
    }, [token])
    useEffect(() => {
        if (status != "success") return
        if (count <= 0)
            window.location.replace("/");
        setTimeout(() => {
            if (count > 0)
                setCount(count - 1);
        }, 1000);
    }, [count, status])

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white">
            {status == "loading" ?
                <div className="flex flex-col gap-2">
                    <Loader2 className="animate-spin" size={40} color="black" />
                </div>
                :
                <div className="flex flex-col gap-6 justify-center items-center w-full max-w-[600px] p-4 text-black">
                    <div className="flex flex-col items-center gap-2">
                        {status == "token_not_found" &&
                            <>
                                <X size={50} className="mb-4" />
                                <h1 className="font-semibold text-center text-3xl">Verification token missing</h1>
                                <p className="font-semibold text-center text-black/60 text-sm">The verification link is incomplete.</p>
                            </>
                        }
                        {status == "error" &&
                            <>
                                <X size={50} className="mb-4" />
                                <h1 className="font-semibold text-center text-3xl">Verification failed</h1>
                                <p className="font-semibold text-center text-black/60 text-sm">This verification link is invalid or has expired.</p>
                            </>
                        }
                        {status == "success" &&
                            <>
                                <Check size={50} className="mb-4" />
                                <h1 className="font-semibold text-center text-3xl">Account verified</h1>
                                <p className="font-semibold text-center text-black/60 text-sm">Your account has been successfully verified. You can now log in.<br />Redirecting in {count} {count < 2 ? "second" : "seconds"}</p>
                            </>
                        }
                    </div>
                    <Link href={"/"} className="cursor-pointer px-3 py-2 rounded-md bg-black text-white font-semibold hover:bg-black/80 active:bg-black">
                        <p>Go back to home</p>
                    </Link>
                </div>
            }
        </div>
    )
}
export default function Verify() {
    return (
    <Suspense fallback={<div>Loading...</div>}>
        <VerifyContent />
    </Suspense>
    );
}
