"use client"

import EditProfileModal from "@/src/components/profile/editProfileModal";
import { useAuth } from "@/src/context/AuthContext";
import { Loader2, Pen } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react"


function ProfileContent() {
  const { token, isLoading: isAuthLoading, user } = useAuth();
  const [openEditProfileModal, setOpenEditProfileModal] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [token, isAuthLoading, router])

const formatDuration = (seconds: number = 0) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-10 items-center w-full h-full p-5 text-black">
    <div className="flex flex-col gap-10 min-w-0 max-w-[550px] w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src={user?.avatar_url || "/img/avatar.jpg"} alt="img profile" width={1000} height={1000} unoptimized className="w-30 h-30 rounded-full" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{user?.username}</h1>
            <h1 className="text-sm text-black/80 font-semibold">{user?.email}</h1>
          </div>
        </div>
        <div className="cursor-pointer flex items-center gap-2 text-white bg-black p-2 text-sm rounded-md font-semibold" onClick={() => setOpenEditProfileModal(true)}>
          <Pen size={16} />
          <p>Edit</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">

        <p className="text-sm font-semibold">Dashboard</p>
        <div className="h-[0.5px] w-full bg-[#dedede]" />
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 flex flex-col gap-5 bg-black/5 rounded-xl p-5">
            <p className="text-xs font-semibold text-black/80">Total message sent</p>
            <p className="text-4xl">{user?.total_messages_sent}</p>
          </div>
          <div className="flex-1 flex flex-col gap-5 bg-black/5 rounded-xl p-5">
            <p className="text-xs font-semibold text-black/80">Total time spent (seconds)</p>
            <p className="text-4xl">{formatDuration(user?.cumulative_time_seconds)}</p>
          </div>
        </div>
      </div>
    </div>
    {openEditProfileModal && <EditProfileModal onClose={() => setOpenEditProfileModal(false)} />}
  </div>
}

export default function Profile() {
  return (
    <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
      <ProfileContent />
    </Suspense>
  );
}
