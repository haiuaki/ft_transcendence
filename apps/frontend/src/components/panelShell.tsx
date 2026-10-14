"use client"

import { Menu, X } from "lucide-react";
import {
  CirclePlusIcon,
  HomeIcon,
  LayoutGrid,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { themeColors } from "../lib/themeColors";
import { RoomControlsProvider, useRoomControls, useRoomControlsActions } from "../context/RoomControlsContext";
import RoomControls from "./room/RoomControls";

export const HomePanel = ({className = ""}) => {
  const { isAuthenticated, user } = useAuth();
  const colors = themeColors;
  const { currentRoom } = useRoomControls();
  const rooms = [
    { icon: <LayoutGrid size={12} />, title: "Browse rooms", href: "/rooms" },
    { icon: <CirclePlusIcon size={12} />, title: "Create a room", href: "/rooms/create" },
  ]
  return (
    <div className={`flex justify-between bg-ui-panel gap-5 h-full w-[300px] shrink-0 flex-col p-4 text-black ${className}`}>
      <div className="flex flex-col gap-5">
        <Link className="w-fit text-2xl font-bold" href={"/"}>ft_cluster</Link>
        <div className="flex flex-col gap-1">
          <Link href={"/"} className="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-ui-hover ">
            <HomeIcon size={12} />
            <p>Home</p>
          </Link>
          <Link href={"/friends"} className="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-ui-hover ">
            <Users size={12}/>
            <p>Friends</p>
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <p className={`text-sm font-semibold ${colors.textSecondary}`}>Rooms</p>
          <div className="flex flex-col gap-1">
            {rooms.map((item, idx) => {
              return (
                <div key={idx} className="flex flex-col">
                  <Link href={item.href} className="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-ui-hover ">
                    {item.icon}
                    <p>{item.title}</p>
                  </Link>
                  {idx === 0 && currentRoom && (
                    <Link
                      href={`/room/${currentRoom.id}`}
                      className="flex min-w-0 items-center gap-2 p-2 rounded-md text-sm hover:bg-ui-hover"
                    >
                      <span aria-hidden className="mb-2 h-3.5 w-3 shrink-0 rounded-bl-[2px] border-b-2 border-l-2 border-black/30 ml-1" />
                      <p className="truncate ">{currentRoom.name}</p>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
      <div className="flex flex-col gap-3">
      <RoomControls />
      {(isAuthenticated && user) ?
          <Link className="cursor-pointer p-2 flex items-center gap-2 text-black rounded-md hover:bg-ui-hover" href={"/profile"}>
            <Image className="rounded-full" width={28} height={28} src={user.avatar_url || "/img/avatar.jpg"} alt={`${user.username}'s avatar`} unoptimized />
            <p className="font-semibold">{user?.username}</p>
          </Link>
        : <div className="flex items-center gap-2">
          <Link href="/signup" className="cursor-pointer w-full flex items-center justify-center p-2 rounded-md font-semibold ring-ui-hover ring-1">
            <p>Sign up</p>
          </Link>
          <Link href="/login" className="cursor-pointer w-full flex items-center justify-center p-2 rounded-md font-semibold bg-black hover:bg-black/90 text-white">
            <p>Log in</p>
          </Link>
        </div>
      }
      </div>
    </div>
  )
}


const PanelShellInner = ({ children }: { children: React.ReactNode }) => {
  const { controls, panelOpen: open } = useRoomControls();
  const { setPanelOpen } = useRoomControlsActions();
  const inRoom = controls !== null;

  return (
    <>
      <div
        onClick={() => setPanelOpen(false)}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity ${inRoom ? "" : "md:hidden"} ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <div
        onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setPanelOpen(false); }}
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 
          ${inRoom ? "shadow-xl" : "md:static md:translate-x-0"} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <HomePanel />
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden bg-white shadow-sm">
        <div className="flex items-center gap-3 p-3 border-b border-black/10 md:hidden">
          <button onClick={() => setPanelOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold">ft_cluster</span>
        </div>
        {children}
      </div>
    </>
  );
};

export const PanelShell = ({ children }: { children: React.ReactNode }) => (
  <RoomControlsProvider>
    <PanelShellInner>{children}</PanelShellInner>
  </RoomControlsProvider>
);
