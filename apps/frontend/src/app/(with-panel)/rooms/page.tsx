"use client"

import { useState } from "react"
import { themeColors } from "@/src/lib/themeColors"
import { motion } from "motion/react"
import { Loader2 } from "lucide-react"
import roomService from "@/src/services/roomService"
import { useAuth } from "@/src/context/AuthContext"
import { toast } from "sonner"
import { InputField } from "../(auth)/login/page"
import { useSearchParams } from "next/navigation"

export default function Rooms() {
  const { token } = useAuth();
  const params = useSearchParams();
  const initialQuery = params.get("q");
  const [query, setQuery] = useState<string>(initialQuery || "")
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = themeColors;

  return <div className="mt-7 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 items-center w-full h-full p-5 text-black">
    <div className="flex flex-col gap-5 max-w-[400px] w-full">
      <h1 className="text-3xl font-semibold">Browse rooms</h1>
      <div className="flex items-center justify-between gap-2 w-full ring-1 ring-[#dedede] focus-within:ring-black/80 rounded-md">
        <input placeholder={"Search a room"} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-2 py-2 outline-none text-sm" />
        </div>
      </div>
    </div>
}
