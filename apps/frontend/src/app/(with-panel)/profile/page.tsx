"use client"

import EditProfileModal from "@/src/components/profile/editProfileModal";
import TwoFactorModal from "@/src/components/profile/TwoFactorModal";
import { useAuth, User } from "@/src/context/AuthContext";
import userService from "@/src/services/userService";
import { Loader2, Pen, XCircle } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner";


function ProfileContent() {
  const params = useSearchParams();
  const username = params.get("username");
  const { token, isLoading: isAuthLoading, user, logout } = useAuth();
  const [openEditProfileModal, setOpenEditProfileModal] = useState<boolean>(false);
  const [twoFactorMode, setTwoFactorMode] = useState<"enable" | "disable" | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!username || username === user?.username) {
      setError("");
      setUserProfile(user);
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setIsLoading(true)
        setError("");
        const data = await userService.getUser(token, username);
        setUserProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch user");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [token, isAuthLoading, router, username, user])

  const formatDuration = (seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  }

  if (isLoading || isAuthLoading) return <div className="h-full w-full flex flex-col justify-center items-center gap-4">
    <Loader2 className="animate-spin" size={28} />
    <p>Loading...</p>
  </div>

  if (error) return <div className="h-full w-full flex flex-col justify-center items-center gap-4">
    <XCircle size={28} />
    <p>{error}</p>
  </div>

  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-10 items-center w-full h-full p-5 text-black">
    <div className="flex flex-col gap-10 min-w-0 max-w-[550px] w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src={userProfile?.avatar_url || "/img/avatar.jpg"} alt="img profile" width={1000} height={1000} unoptimized className="w-30 h-30 rounded-full" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{userProfile?.username}</h1>
            <h1 className="text-sm text-black/80 font-semibold">{userProfile?.email}</h1>
          </div>
        </div>
        {(!username || username == user?.username) && <div className="cursor-pointer flex items-center gap-2 text-white bg-black p-2 text-sm rounded-md font-semibold" onClick={() => setOpenEditProfileModal(true)}>
          <Pen size={16} />
          <p>Edit</p>
        </div>}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold">Dashboard</p>
        <div className="h-[0.5px] w-full bg-[#dedede]" />
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 flex flex-col gap-5 bg-black/5 rounded-xl p-5">
            <p className="text-xs font-semibold text-black/80">Total message sent</p>
            <p className="text-4xl">{userProfile?.total_messages_sent}</p>
          </div>
          <div className="flex-1 flex flex-col gap-5 bg-black/5 rounded-xl p-5">
            <p className="text-xs font-semibold text-black/80">Total time spent (seconds)</p>
            <p className="text-4xl">{formatDuration(userProfile?.cumulative_time_seconds)}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">Settings</p>
          <div className="h-[0.5px] w-full bg-[#dedede]" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-sm font-semibold">Two-factor authentication</p>
              <p className="text-xs text-black/60">Add an extra layer of security to your account at sign-in.</p>
            </div>
            <button className="cursor-pointer text-sm p-2 rounded-md ring ring-[#dedede] hover:bg-black/5 shrink-0" onClick={() => setTwoFactorMode(user?.is_2fa_enabled ? "disable" : "enable")}>
              <p>{user?.is_2fa_enabled ? "Disable" : "Enable"}</p>
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-sm font-semibold">Sign out</p>
              <p className="text-xs text-black/60">End your current session on this device.</p>
            </div>
            <button className="cursor-pointer text-sm p-2 rounded-md ring ring-[#dedede] hover:bg-black/5 shrink-0" onClick={() => logout()}>
              <p>Sign out</p>
            </button>
          </div>
        </div>
      </div>
    </div>
    {openEditProfileModal && <EditProfileModal onClose={() => setOpenEditProfileModal(false)} />}
    {twoFactorMode && <TwoFactorModal mode={twoFactorMode} onClose={() => setTwoFactorMode(null)} />}
  </div>
}

export default function Profile() {
  return (
    <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
      <ProfileContent />
    </Suspense>
  );
}
