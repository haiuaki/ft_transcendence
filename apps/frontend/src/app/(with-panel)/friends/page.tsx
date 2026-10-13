"use client"

import AddFriendModal from "@/src/components/friends/addFriendModal";
import ConfirmRemoveFriendModal from "@/src/components/friends/confirmRemoveFriendModal";
import { useAuth } from "@/src/context/AuthContext";
import { useSocket } from "@/src/context/SocketContext";
import friendService, { Friend } from "@/src/services/friendService"
import { Loader2, Plus, Search, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner";

const FRIENDS_POLL_INTERVAL_MS = 20000;

function FriendsContent() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { subscribe } = useSocket();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const params = useSearchParams();
  const initialQuery = params.get("q");
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState<string>(initialQuery || "");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [friendsData, requestsData] = await Promise.all([
          friendService.friends(token),
          friendService.requests(token),
        ]);
        setFriends(friendsData);
        setRequests(requestsData);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load friends");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, isAuthLoading, router])

  // Refresh friends in the background so online status stays current
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        setFriends(await friendService.friends(token));
      } catch {
        // Keep the current list, the next poll will retry
      }
    }, FRIENDS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token])

  // Keep requests and friends in sync live, without a page refresh
  useEffect(() => {
    return subscribe((message) => {
      const other = message.payload as Friend;
      if (message.type === "friend_request")
        setRequests((prev) => prev.some((r) => r.username === other.username) ? prev : [...prev, other]);
      else if (message.type === "friend_accepted")
        setFriends((prev) => prev.some((f) => f.username === other.username) ? prev : [...prev, other]);
      else if (message.type === "friend_removed")
        setFriends((prev) => prev.filter((f) => f.username !== other.username));
      else if (message.type === "status_changed")
        setFriends((prev) => prev.map((f) => f.username === other.username ? { ...f, status: other.status } : f));
      else if (message.type === "user_updated") {
        const { old_username, username, avatar_url } = message.payload;
        setFriends((prev) => prev.map((f) => f.username === old_username ? { ...f, username, avatar_url } : f));
      }
    });
  }, [subscribe])

  const acceptRequest = async (friendUsername: string) => {
    try {
      setIsLoading(true)
      await friendService.accept(token || "", friendUsername)
      const accepted = requests.find((r) => r.username === friendUsername)
      setRequests((prev) => prev.filter((r) => r.username !== friendUsername))
      if (accepted) setFriends((prev) => [...prev, accepted])
      toast.success(`${friendUsername} is now your friend`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept request")
    } finally {
      setIsLoading(false)
    }
  }

  const denyRequest = async (friendUsername: string) => {
    try {
      setIsLoading(true)
      await friendService.deny(token || "", friendUsername)
      setRequests((prev) => prev.filter((r) => r.username !== friendUsername))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to deny request")
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuery = (value: string) => {
    setQuery(value);
    const newParams = new URLSearchParams(params.toString());
    if (value.trim()) {
      newParams.set("q", value);
    } else {
      newParams.delete("q")
    }
    const url = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
    router.replace(url, { scroll: false });
  }

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(query.trim().toLowerCase())
  );

  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 items-center w-full h-full p-5 text-black">
    <div className="flex flex-col gap-5 min-w-0 max-w-[550px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Friends</h1>
        <div className="cursor-pointer flex items-center gap-2 text-white bg-black p-2 text-sm rounded-md font-semibold" onClick={() => setIsOpenAddModal(true)}>
          <Plus size={16} />
          <p>Add</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-between gap-2 w-full ring-1 ring-ui-line focus-within:ring-black/80 rounded-md pl-2">
          <Search size={12} className="shrink-0" />
          <input placeholder={"Search a friend"} value={query} onChange={(e) => updateQuery(e.target.value)} className="w-full py-2 outline-none text-sm" />
        </div>
      </div>
      <div className="h-[0.5px] w-full bg-ui-line" />
      {isLoading && <div className="mt-20 flex flex-col items-center gap-2">
        <Loader2 className="animate-spin" size={24} />
        <p>Loading...</p>
      </div>}
      {!isLoading && filteredFriends.length == 0 && requests.length == 0 && <div className="mt-20 flex flex-col items-center gap-2">
        <Search size={24} />
        <p>{friends.length == 0 ? "No friends yet" : "No rooms match your search."}</p>
      </div>}
      {!isLoading && requests.length > 0 && requests.map((item, idx) => {
        return <div key={idx} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src={item.avatar_url || "/img/avatar.jpg"} alt={item.username} width={40} height={40} unoptimized className="w-10 h-10 rounded-full object-cover shrink-0" />
            <Link className="hover:underline" href={`/users/${item.username}?from=friends`}>{item.username}</Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="cursor-pointer flex items-center gap-2 ring-1 ring-ui-line p-2 text-sm rounded-md font-semibold" onClick={() => denyRequest(item.username)}>
              <p>Deny</p>
            </div>
            <div className="cursor-pointer flex items-center gap-2 text-white bg-black p-2 text-sm rounded-md font-semibold" onClick={() => acceptRequest(item.username)}>
              <p>Accept</p>
            </div>

          </div>
        </div>
      })}
      {!isLoading && filteredFriends.length > 0 && filteredFriends.map((item, idx) => {
        return <div key={idx} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Image src={item.avatar_url || "/img/avatar.jpg"} alt={item.username} width={32} height={32} unoptimized className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className={`flex items-center justify-center w-2.5 h-2.5 rounded-full ${item.status === "ONLINE" ? "bg-[#45a367]" : "bg-gray-300"} border border-gray-300 absolute bottom-0 right-0`}>
                {item.status != "ONLINE" && <div className="w-1 h-1 rounded-full bg-white" />}
              </div>
            </div>
            <Link className="hover:underline" href={`/users/${item.username}?from=friends`}>{item.username}</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link className="cursor-pointer flex items-center gap-2 ring-1 ring-ui-line p-2 text-sm rounded-md font-semibold" href={`/chat/${item.username}`}>
              <p>Chat</p>
            </Link>
            <div className="cursor-pointer flex items-center gap-2  p-2 text-sm rounded-md font-semibold" onClick={() => setFriendToRemove(item)}>
              <Trash size={16} color="black" />
            </div>

          </div>
        </div>
      })}
    </div>
    {isOpenAddModal && <AddFriendModal token={token || ""} onClose={() => setIsOpenAddModal(false)} />}
    {friendToRemove && <ConfirmRemoveFriendModal
      token={token || ""}
      user={friendToRemove}
      onClose={() => setFriendToRemove(null)}
      onSuccess={() => setFriends((prev) => prev.filter((f) => f.username !== friendToRemove.username))}
    />}
  </div>
}

export default function Friends() {
  return (
    <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
      <FriendsContent />
    </Suspense>
  );
}
