"use client"

import EditProfileModal from "./editProfileModal";
import TwoFactorModal from "./TwoFactorModal";
import ActivityCharts from "./ActivityCharts";
import { useAuth, User } from "@/src/context/AuthContext";
import { useSocket } from "@/src/context/SocketContext";
import friendService, { FriendshipStatus } from "@/src/services/friendService";
import userService from "@/src/services/userService";
import { ArrowLeft, Check, Clock, Loader2, MessageCircle, Pen, UserPlus, X, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner";

interface ProfileViewProps {
  username?: string,
  backHref?: string,
  compact?: boolean,
}

const ProfileView = ({ username, backHref, compact = false }: ProfileViewProps) => {
  const { token, isLoading: isAuthLoading, user, logout } = useAuth();
  const { subscribe, isConnected } = useSocket();
  const [friendAction, setFriendAction] = useState<"add" | "accept" | "deny" | null>(null);
  const [openEditProfileModal, setOpenEditProfileModal] = useState<boolean>(false);
  const [twoFactorMode, setTwoFactorMode] = useState<"enable" | "disable" | null>(null);
  const [fetched, setFetched] = useState<{ username: string, user: User | null, error: string } | null>(null);
  const router = useRouter();
  const isOwnProfile = !username || username.toLowerCase() === user?.username.toLowerCase();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (isOwnProfile) {
      if (username && !compact) router.replace("/profile");
      return;
    }
    if (!username) return;

    const fetchUser = async () => {
      try {
        const data = await userService.getUser(token, username);
        setFetched({ username, user: data, error: "" });
      } catch (e) {
        setFetched({ username, user: null, error: e instanceof Error ? e.message : "Failed to fetch user" });
      }
    };
    fetchUser();
  }, [token, isAuthLoading, router, username, isOwnProfile, compact])

  const patchFetchedUser = useCallback((fields: Partial<User>) => {
    setFetched((prev) => prev?.user ? { ...prev, user: { ...prev.user, ...fields } } : prev);
  }, [])
  const setFriendshipStatus = useCallback((status: FriendshipStatus) => patchFetchedUser({ friendship_status: status }), [patchFetchedUser])

  // Keep the viewed profile in sync with what the other user does
  useEffect(() => {
    if (!username) return;
    return subscribe((message) => {
      const { payload } = message;
      if (message.type === "user_updated") {
        // Follow a rename to the new URL, which refetches the profile
        if (compact && payload.old_username.toLowerCase() === username.toLowerCase()) {
          patchFetchedUser(payload);
          return;
        }
        if (payload.old_username.toLowerCase() === username.toLowerCase())
          router.replace(`/users/${payload.username}${window.location.search}`);
        return;
      }
      if (payload?.username?.toLowerCase() !== username.toLowerCase()) return;
      if (message.type === "friend_request") setFriendshipStatus("pending_received");
      else if (message.type === "friend_accepted") setFriendshipStatus("friends");
      else if (message.type === "friend_removed") setFriendshipStatus("none");
      else if (message.type === "status_changed") patchFetchedUser({ status: payload.status });
    });
  }, [subscribe, username, router, setFriendshipStatus, patchFetchedUser, compact])

  const runFriendAction = async (name: "add" | "accept" | "deny", action: () => Promise<string>, nextStatus: FriendshipStatus) => {
    try {
      setFriendAction(name);
      toast.success(await action());
      setFriendshipStatus(nextStatus);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setFriendAction(null);
    }
  }

  const isLoading = !isOwnProfile && fetched?.username !== username;
  const error = isOwnProfile ? "" : fetched?.error ?? "";
  const userProfile = isOwnProfile ? user : fetched?.user ?? null;
  // Our own status can lag behind the socket, so trust the live connection instead
  const isOnline = isOwnProfile ? isConnected : userProfile?.status === "ONLINE";

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

  return <div className={compact ? "flex flex-col gap-6 w-full text-black" : "mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-10 items-center w-full h-full p-5 text-black"}>
    <div className={`flex flex-col ${compact ? "gap-6" : "gap-10"} min-w-0 max-w-[550px] w-full`}>
      {!isOwnProfile && backHref && <Link href={backHref} className="-mb-6 self-start flex items-center justify-center p-1 rounded-md hover:bg-black/5">
        <ArrowLeft size={16} />
      </Link>}
      <div className={compact ? "flex flex-wrap items-center justify-between gap-4" : "flex items-center justify-between"}>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Image src={userProfile?.avatar_url || "/img/avatar.jpg"} alt="img profile" width={1000} height={1000} unoptimized className={compact ? "w-16 h-16 rounded-full object-cover" : "w-30 h-30 rounded-full"} />
            <div className={`absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full border-3 border-white ${isOnline ? "bg-[#45a367]" : "bg-gray-300"}`} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className={compact ? "text-xl font-semibold break-all" : "text-3xl font-semibold"}>{userProfile?.username}</h1>
            <p className={`text-xs font-semibold ${isOnline ? "text-[#45a367]" : "text-black/50"}`}>{isOnline ? "Online" : "Offline"}</p>
            <h1 className="text-sm text-black/80 font-semibold break-all">{userProfile?.email}</h1>
          </div>
        </div>
        {isOwnProfile && <div className="cursor-pointer flex items-center gap-2 text-white bg-black p-2 text-sm rounded-md font-semibold" onClick={() => setOpenEditProfileModal(true)}>
          <Pen size={16} />
          <p>Edit</p>
        </div>}
        {!isOwnProfile && token && userProfile && <>
          {userProfile.friendship_status === "friends" && <Link className="flex items-center gap-2 text-white bg-black p-2 text-sm rounded-md font-semibold" href={`/chat/${userProfile.username}?from=profile`}>
            <MessageCircle size={16} />
            <p>Chat</p>
          </Link>}
          {userProfile.friendship_status === "none" && <button disabled={friendAction !== null} className="cursor-pointer flex items-center gap-2 text-white bg-black disabled:bg-black/80 p-2 text-sm rounded-md font-semibold" onClick={() => runFriendAction("add", () => friendService.add(token, userProfile.username), "pending_sent")}>
            {friendAction === "add" ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            <p>Add friend</p>
          </button>}
          {userProfile.friendship_status === "pending_received" && <div className="flex items-center gap-2">
            <button disabled={friendAction !== null} className="cursor-pointer flex items-center gap-2 ring-1 ring-ui-line hover:bg-black/5 disabled:opacity-60 p-2 text-sm rounded-md font-semibold" onClick={() => runFriendAction("deny", () => friendService.deny(token, userProfile.username), "none")}>
              {friendAction === "deny" ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              <p>Deny</p>
            </button>
            <button disabled={friendAction !== null} className="cursor-pointer flex items-center gap-2 text-white bg-black disabled:bg-black/80 p-2 text-sm rounded-md font-semibold" onClick={() => runFriendAction("accept", () => friendService.accept(token, userProfile.username), "friends")}>
              {friendAction === "accept" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <p>Accept</p>
            </button>
          </div>}
          {userProfile.friendship_status === "pending_sent" && <div className="flex items-center gap-2 ring-1 ring-ui-line text-black/60 p-2 text-sm rounded-md font-semibold">
            <Clock size={16} />
            <p>Request sent</p>
          </div>}
        </>}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold">Dashboard</p>
        <div className="h-[0.5px] w-full bg-ui-line" />
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 flex flex-col gap-5 bg-black/5 rounded-xl p-5">
            <p className="text-xs font-semibold text-black/80">Total message sent</p>
            <p className={compact ? "text-2xl" : "text-4xl"}>{userProfile?.total_messages_sent}</p>
          </div>
          <div className="flex-1 flex flex-col gap-5 bg-black/5 rounded-xl p-5">
            <p className="text-xs font-semibold text-black/80">Total time spent</p>
            <p className={compact ? "text-2xl" : "text-4xl"}>{formatDuration(userProfile?.cumulative_time_seconds)}</p>
          </div>
        </div>
        {isOwnProfile && token && <ActivityCharts token={token} compact={compact} />}
      </div>

      {isOwnProfile && <div className="flex flex-col gap-2">

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">Settings</p>
          <div className="h-[0.5px] w-full bg-ui-line" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-sm font-semibold">Two-factor authentication</p>
              <p className="text-xs text-black/60">Add an extra layer of security to your account at sign-in.</p>
            </div>
            <button className="cursor-pointer text-sm p-2 rounded-md ring ring-ui-line hover:bg-black/5 shrink-0" onClick={() => setTwoFactorMode(user?.is_2fa_enabled ? "disable" : "enable")}>
              <p>{user?.is_2fa_enabled ? "Disable" : "Enable"}</p>
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-sm font-semibold">Sign out</p>
              <p className="text-xs text-black/60">End your current session on this device.</p>
            </div>
            <button className="cursor-pointer text-sm p-2 rounded-md ring ring-ui-line hover:bg-black/5 shrink-0" onClick={() => logout()}>
              <p>Sign out</p>
            </button>
          </div>
        </div>
      </div>
      }
    </div>
    {openEditProfileModal && <EditProfileModal onClose={() => setOpenEditProfileModal(false)} />}
    {twoFactorMode && <TwoFactorModal mode={twoFactorMode} onClose={() => setTwoFactorMode(null)} />}
  </div>
}

export default ProfileView;
