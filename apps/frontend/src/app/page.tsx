"use client"
import { FaMessage } from "react-icons/fa6";
import ThreeScene from "../components/3D/ThreeScene";
import { FaUser } from "react-icons/fa";
import { useState } from "react";
import { ChatPanel } from "../components/panel/chatPanel/chatPanel";
import { AuthModal } from "../components/authModal/authModal";

export default function Home() {
  const [openSignUp, setOpenSignUp] = useState<boolean>(false);
  const [openLogIn, setOpenLogIn] = useState<boolean>(false);

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
        <AuthModal isOpen={openSignUp} onClose={() => setOpenSignUp(false)} view="sign_up"/>
        <AuthModal isOpen={openLogIn} onClose={() => setOpenLogIn(false)} view="log_in" />
    </main>
  );
}
