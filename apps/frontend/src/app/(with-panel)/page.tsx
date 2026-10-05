"use client"

import ThreeScene from "../../components/3D/ThreeScene";
import { Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  CirclePlusIcon,
  HomeIcon,
  LayoutGrid,
  Users,
} from "lucide-react";
import { themeColors } from "../../lib/themeColors";
import Link from "next/link";
import Image from "next/image";
import { TbFriends } from "react-icons/tb";

export const HomePanel = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const colors = themeColors;

  const rooms = [
    { icon: <LayoutGrid size={12} />, title: "Browse rooms", href: "/rooms" },
    { icon: <CirclePlusIcon size={12} />, title: "Create a room", href: "/rooms/create" },
  ]
  return (
    <div className="flex flex- justify-between gap-5 h-full w-[300px] shrink-0 flex-col p-4 text-black">
      <div className="flex flex-col gap-5">
        <Link className="w-fit text-2xl font-bold" href={"/"}>FT_Cluster</Link>
        <div className="flex flex-col gap-1">
          <Link href={"/"} className="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-[#dededc] ">
            <HomeIcon size={12} />
            <p>Home</p>
          </Link>
          <Link href={"/friends"} className="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-[#dededc] ">
            <Users size={12}/>
            <p>Friends</p>
          </Link>
        </div>
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
      {(isAuthenticated && user) ?
        <div className="cursor-pointer flex items-center justify-between gap-2 text-black">
          <div className="flex items-center gap-2">
            <Image className="rounded-full" width={28} height={28} src={user.avatar_url || "/img/avatar.jpg"} alt={`${user.username}'s avatar`} unoptimized />
            <p className="font-semibold">{user?.username}</p>
          </div>
          <p onClick={async () => logout()} className="text-xs hover:underline">Logout</p>
        </div>
        : <div className="flex items-center gap-2">
          <Link href="/signup" className="cursor-pointer w-full flex items-center justify-center p-2 rounded-md font-semibold ring-[#dededc] ring-1">
            <p>Sign up</p>
          </Link>
          <Link href="/login" className="cursor-pointer w-full flex items-center justify-center p-2 rounded-md font-semibold bg-black hover:bg-black/90 text-white">
            <p>Log in</p>
          </Link>
        </div>
      }
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
