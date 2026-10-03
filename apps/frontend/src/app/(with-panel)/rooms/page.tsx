"use client"

import { Suspense, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react"
import roomService from "@/src/services/roomService"
import { useAuth } from "@/src/context/AuthContext"
import { toast } from "sonner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface Room {
  id: number;
  name: string;
  type: "PUBLIC" | "PRIVATE";
  owner_id?: string;
  active_members: number;
  created_at: string;
}


function RoomsContent() {
  const { token } = useAuth();
  const params = useSearchParams();
  const initialQuery = params.get("q");
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState<string>(initialQuery || "")
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchRooms = async () => {
      setIsLoading(true);

      try {
        const fetchedRooms = await roomService.rooms(token);
        setRooms(fetchedRooms);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to fetch rooms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [token]);

  const filteredRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return rooms;
    }

    return rooms.filter((room) =>
      room.name.toLowerCase().includes(normalizedQuery)
    );
  }, [rooms, query]);

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

  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 items-center w-full h-full p-5 text-black">
    <div className="flex flex-col gap-5 max-w-[550px] w-full">
      <h1 className="text-3xl font-semibold">Browse rooms</h1>
      <div className="flex items-center justify-between gap-2 w-full ring-1 ring-[#dedede] focus-within:ring-black/80 rounded-md pl-2">
        <Search size={12} className="shrink-0" />
        <input placeholder={"Search a room"} value={query} onChange={(e) => updateQuery(e.target.value)} className="w-full py-2 outline-none text-sm" />
      </div>
      <div className="h-[0.5px] w-full bg-[#dedede]" />
      {filteredRooms.length > 0 ?
        <div className="flex flex-col">
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            filteredRooms.map((room) => (
              <div key={room.id} className="cursor-pointer flex items-center justify-between p-2 rounded-md hover:bg-black/5">
                <h2>{room.name}</h2>
                <p>{room.active_members} members</p>
              </div>
            ))
          )
          }
        </div>
        : <div className="mt-20 flex flex-col items-center justify-center gap-2">
          <Search size={24}/>
          <p>No rooms match your search.</p>
        </div>
      }
    </div>
  </div>
}

export default function Rooms() {
  return (
    <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
      <RoomsContent />
    </Suspense>
  );
}
