"use client"

import { ChangeEvent, RefObject, useEffect, useRef, useState } from "react"
import InputField from "@/src/components/InputField"
import { AnimatePresence, motion } from "motion/react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import roomService, { RoomModel } from "@/src/services/roomService"
import { useAuth } from "@/src/context/AuthContext"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import DynamicModalTemplate from "@/src/components/TemplateModal/DynamicModalTemplate"
import { roomNameProblem, roomPasswordProblem } from "@/src/lib/validation";

interface ModelMenuProps {
  ref: RefObject<HTMLElement | null>;
  models: RoomModel[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

const ModelMenu = ({ ref, models, selectedModelId, onSelect, onClose }: ModelMenuProps) => {
  return (
    <DynamicModalTemplate ref={ref} className="text-black w-full max-w-[400px] ring-1 ring-ui-line bg-white rounded-md p-2" onClose={onClose}>
      {models.map((model, idx) => (
        <div key={idx} className="cursor-pointer flex items-center justify-between p-2 hover:bg-black/5 rounded-md text-sm" onClick={() => onSelect(model.id)}>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{model.name}</p>
            <p className="text-xs">{model.max_capacity} seats</p>
          </div>
          {selectedModelId === model.id && <Check size={12} />}
        </div>
      ))}
    </DynamicModalTemplate>
  )
}

export default function CreateRoom() {
  const [models, setModels] = useState<RoomModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const { token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [roomFormData, setRoomFormData] = useState({ name: "", isPublic: false, password: "" })
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false);
  const selectedModelRef = useRef(null);

  const currentModel = models.find((model) => model.id === selectedModelId);
  useEffect(() => {
    const fetchModels = async (token: string) => {
      try {
        const data = await roomService.models(token);
        setModels(data);
        setSelectedModelId(data[0]?.id ?? "");
      } catch {
        toast.error("Failed to load room models")
      }
    }
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchModels(token);
  }, [isAuthLoading, token, router])

  if (isAuthLoading || !token) return <Loader2 className="m-auto animate-spin" />;
  return <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-center gap-5 items-center w-full h-full p-5 text-black">
    <div className="flex flex-col gap-5 max-w-[400px] w-full">
      <h1 className="text-3xl font-semibold">Create a room</h1>
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-sm">Room model</p>
        <div ref={selectedModelRef} className="cursor-pointer flex items-center justify-between ring-1 ring-ui-line rounded-md p-2 text-sm" onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{currentModel?.name}</p>
            <p className="text-xs">{currentModel?.max_capacity} seats</p>
          </div>
          <ChevronDown size={12} />
        </div>
      </div>
      <InputField title="Room name" maxLength={30} value={roomFormData.name} onChange={(e: ChangeEvent<HTMLInputElement>) => { setError(null); setRoomFormData({ ...roomFormData, name: e.target.value }) }} />
      <div className="flex items-center justify-between">
        <p className={`font-semibold text-sm `}>Public Room</p>
        <motion.div className={`h-[27px] w-[50px] rounded-2xl ${roomFormData.isPublic ? "bg-black/95" : "bg-black/90"} flex items-center px-1 cursor-pointer`} onClick={() => setRoomFormData({ ...roomFormData, password: "", isPublic: !roomFormData.isPublic })}>
          <motion.div animate={{ x: roomFormData.isPublic ? 25 : 0 }} transition={{
            duration: 0.2,
            ease: "easeInOut"
          }} className="w-4 h-4 rounded-full bg-white" />
        </motion.div>
      </div>
      <InputField title="Password" value={roomFormData.password} onChange={(e: ChangeEvent<HTMLInputElement>) => { setError(null); setRoomFormData({ ...roomFormData, password: e.target.value }) }} type="password" disabled={roomFormData.isPublic} />
      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
      <button
        disabled={isLoading}
        className={`select-none w-full flex items-center gap-2 justify-center p-2 rounded-md cursor-pointer ${isLoading ? "bg-black/80" : "bg-black hover:bg-black/85 active:bg-black/90 active:scale-99"} text-white `}
        onClick={async () => {
          try {
            const nameProblem = roomNameProblem(roomFormData.name);
            if (nameProblem) return setError(nameProblem);
            const passwordProblem = roomFormData.isPublic ? null : roomPasswordProblem(roomFormData.password);
            if (passwordProblem) return setError(passwordProblem);
            setIsLoading(true);
            const roomId = await roomService.create(token || "", roomFormData.name, roomFormData.isPublic ? "PUBLIC" : "PRIVATE", roomFormData.password, selectedModelId);
            router.push(`/room/${roomId}`);
            setRoomFormData({ name: "", isPublic: false, password: "" });
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
    <AnimatePresence>
      {isModelMenuOpen && (
        <ModelMenu
          ref={selectedModelRef}
          models={models}
          selectedModelId={selectedModelId}
          onSelect={(modelId) => {
            setSelectedModelId(modelId);
            setIsModelMenuOpen(false);
          }}
          onClose={() => setIsModelMenuOpen(false)}
        />
      )}
    </AnimatePresence>
  </div>
}
