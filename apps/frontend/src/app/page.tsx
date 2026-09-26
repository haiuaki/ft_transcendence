"use client"
import { FaMessage } from "react-icons/fa6";
import ThreeScene from "../components/3D/ThreeScene";
import { FaUser } from "react-icons/fa";
import { useState } from "react";
import { ChatPanel } from "../components/panel/chatPanel/chatPanel";
import Link from "next/link";
import { AuthModal } from "../components/authModal/authModal";

export default function Home() {
  const [openChatPanel, setOpenChatPanel] = useState<boolean>(false);
  const [openSignUpPanel, setOpenSignUpPanel] = useState<boolean>(false);

  return (
    <main className="scene-page flex">
        <div className="flex items-center flex-col fixed top-0 p-5 z-50 gap-2">
          <div className="cursor-pointer flex items-center p-3 border border-1 border-gray-600 bg-[#1C1C1E] rounded-md">
            <FaUser size={14} color="white" />
          </div>
          <div 
          className="cursor-pointer flex items-center p-3 border border-1 border-gray-600 bg-[#1C1C1E] rounded-md"
          onClick={() => setOpenChatPanel(!openChatPanel)}
          >
            <FaMessage size={14} color="white" />
          </div>
          <div 
          className="cursor-pointer flex items-center p-3 border border-1 border-gray-600 bg-[#1C1C1E] rounded-md"
          onClick={() => setOpenSignUpPanel(!openChatPanel)}
          >
            <FaUser size={14} color="white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <ThreeScene />
        </div>
        <ChatPanel isOpen={openChatPanel} onClose={() => setOpenChatPanel(false)}/>
        <AuthModal isOpen={openSignUpPanel} onClose={() => setOpenSignUpPanel(false)} type="signup"/>
    </main>
  );
}
