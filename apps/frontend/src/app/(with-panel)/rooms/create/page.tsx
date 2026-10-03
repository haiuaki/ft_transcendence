"use client"

import { ChangeEvent, useState } from "react"
import InputField from "@/src/components/InputField"
import {motion} from "motion/react"
import { Loader2 } from "lucide-react"
import roomService from "@/src/services/roomService"
import { useAuth } from "@/src/context/AuthContext"
import { toast } from "sonner"

export default function CreateRoom() {
  const {token} = useAuth();
  const [roomFormData, setRoomFormData] = useState({ name: "", isPublic: false, password: "" })
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-center gap-5 items-center w-full h-full p-5 text-black">
    <div className="flex flex-col gap-5 max-w-[400px] w-full">
    <h1 className="text-3xl font-semibold">Create a room</h1>
    <InputField title="Room name" maxLength={30} value={roomFormData.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomFormData({ ...roomFormData, name: e.target.value })} />
      <div className="flex items-center justify-between">
        <p className={`font-semibold text-sm `}>Public Room</p>
        <motion.div className={`h-[27px] w-[50px] rounded-2xl ${roomFormData.isPublic ? "bg-black/95" : "bg-black/90"} flex items-center px-1 cursor-pointer`} onClick={() => setRoomFormData({...roomFormData, password: "", isPublic: !roomFormData.isPublic})}>
          <motion.div animate={{x:roomFormData.isPublic ? 25 : 0}} transition={{
            duration: 0.2,
            ease: "easeInOut"
          }} className="w-4 h-4 rounded-full bg-white"/>
        </motion.div>
      </div>
      <InputField title="Password" value={roomFormData.password} onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomFormData({ ...roomFormData, password: e.target.value })} type="password" disabled={roomFormData.isPublic}/>
      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
      <button
        disabled={isLoading}
        className={`select-none w-full flex items-center gap-2 justify-center p-2 rounded-md cursor-pointer ${isLoading ? "bg-black/80" : "bg-black hover:bg-black/85 active:bg-black/90 active:scale-99"} text-white `}
        onClick={async () => {
          try {
            setIsLoading(true);
            await roomService.create(token || "", roomFormData.name, roomFormData.isPublic ? "PUBLIC" : "PRIVATE" , roomFormData.password);
            toast.success("okokokook");
            setRoomFormData({name: "", isPublic: false, password: ""});
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create room")
          } finally {
            setIsLoading(false);
          }
        }}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : null}
        <p className="font-medium text-md"> {isLoading ? `Creating ${roomFormData.isPublic ? "public" : "private"} room` : `Create ${roomFormData.isPublic ? "public" : "private"} room`}</p>
      </button>

    </div>
  </div>
}
