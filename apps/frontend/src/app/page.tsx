"use client"
import { FaMessage } from "react-icons/fa6";
import ThreeScene from "../components/3D/ThreeScene";
import { FaUser } from "react-icons/fa";
import { Suspense, useEffect, useState } from "react";
import { ChatPanel } from "../components/Panel/ChatPanel/ChatPanel";
import { AuthModal } from "../components/AuthModal/AuthModal";
import { useSearchParams } from "next/navigation";
import userService from "../services/userService";
import { toast, Toaster } from "sonner";
import Link from "next/link";

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
        toast.success("Verified account")
        setOpenLogIn(true);
      } catch (e) {
        console.log(e);
      }
    }
    verifyAccount();
  }, [verifyToken])
  return (
    <main className="flex w-full h-full overflow-hidden">
        <div className="flex items-center fixed top-0 right-0 p-5 z-50 gap-2">
          <div className="cursor-pointer flex items-center py-2 px-3 bg-white rounded-lg" onClick={() => setOpenLogIn(true)}>
            <p className="text-black">Log in</p>
          </div>
          <div className="cursor-pointer flex items-center py-2 px-3 bg-white rounded-lg" onClick={() => setOpenSignUp(true)}>
            <p className="text-black">Sign up</p>
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
