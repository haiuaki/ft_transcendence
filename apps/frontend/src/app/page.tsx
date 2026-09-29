"use client"

import ThreeScene from "../components/3D/ThreeScene";
import { Suspense, useEffect, useState } from "react";
import { AuthModal } from "../components/AuthModal/AuthModal";
import { useSearchParams } from "next/navigation";
import userService from "../services/userService";
import { toast, Toaster } from "sonner";

function HomeContent() {
  const params = useSearchParams();
  const verifyToken = params.get("verifyToken");
  const [openSignUp, setOpenSignUp] = useState<boolean>(false);
  const [openLogIn, setOpenLogIn] = useState<boolean>(false);

  useEffect(() => {
    if (!verifyToken) return;
    const verifyAccount = async () => {
      try {
        await userService.verify(verifyToken);
        toast.success("Your account has been successfully verified. You can now log in.")
        setOpenLogIn(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to verify account")
      }
    }
    verifyAccount();
  }, [verifyToken])

  return (
    <main className="flex w-full h-full overflow-hidden">
        <div className="select-none flex items-center fixed top-0 right-0 p-5 z-50 gap-2">
          <div className="cursor-pointer font-semibold flex items-center py-2 px-3 text-black bg-white rounded-md hover:bg-white/80 active:bg-white" onClick={() => setOpenLogIn(true)}>
            <p>Log in</p>
          </div>
          <div className="cursor-pointer font-semibold flex items-center py-2 px-3 text-white bg-black rounded-md hover:bg-black/80 active:bg-black" onClick={() => setOpenSignUp(true)}>
            <p>Sign up</p>
          </div>
        </div>
          <div className={"scene-page bg-black"}>
            <ThreeScene />
          </div>
          <Toaster position="bottom-right" richColors closeButton />
        <AuthModal isOpen={openSignUp} onClose={() => setOpenSignUp(false)} view="sign_up"/>
        <AuthModal isOpen={openLogIn} onClose={() => setOpenLogIn(false)} view="log_in" />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-black"></div>}>
      <HomeContent />
    </Suspense>
  );
}
