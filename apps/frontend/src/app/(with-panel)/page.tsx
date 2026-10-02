"use client"

import ThreeScene from "../../components/3D/ThreeScene";
import { Suspense, useState } from "react";
import { AuthModal } from "../../components/AuthModal/AuthModal";
import { useAuth } from "../../context/AuthContext";
import {
  CirclePlusIcon,
  DoorOpen,
  LayoutGrid,
} from "lucide-react";
import { themeColors } from "../../lib/themeColors";
import Link from "next/link";

export const HomePanel = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [openSignUp, setOpenSignUp] = useState<boolean>(false);
  const [openLogIn, setOpenLogIn] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState("profile");

  const colors = themeColors;

  const rooms = [
    { icon: <LayoutGrid size={12} />, title: "Browse rooms", href: "/rooms" },
    { icon: <CirclePlusIcon size={12} />, title: "Create a room", href: "/rooms/create" },
    { icon: <DoorOpen size={12} />, title: "Join a room", href: "/rooms/join" },
  ]
  return (
    <div className="flex flex- justify-between gap-5 h-full w-[300px] shrink-0 flex-col p-4 text-black">
      <div className="flex flex-col gap-5">
        <Link className="w-fit text-2xl font-bold" href={"/"}>FT_Cluster</Link>
        <div className="flex flex-col gap-2">
          <p className={`text-sm font-semibold ${colors.textSecondary}`}>Rooms</p>
          <div className="flex flex-col gap-1">
            {rooms.map((item, idx) => {
              return (
                <Link key={idx} href={item.href} className="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-[#dededc] ">
                  {item.icon}
                  <p>{item.title}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="cursor-pointer w-full flex items-center justify-center p-2 rounded-md font-semibold ring-[#dededc] ring-1">
          <p>Sign up</p>
        </div>
        <div className="cursor-pointer w-full flex items-center justify-center p-2 rounded-md font-semibold bg-black hover:bg-black/90 text-white">
          <p>Log in</p>
        </div>
      </div>
      <AuthModal isOpen={openSignUp} onClose={() => setOpenSignUp(false)} view="sign_up" />
      <AuthModal isOpen={openLogIn} onClose={() => setOpenLogIn(false)} view="log_in" />
    </div>
  )
}

function HomeContent() {
  return (
    <div className="scene-page">
      <ThreeScene />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-black"></div>}>
      <HomeContent />
    </Suspense>
  );
}
