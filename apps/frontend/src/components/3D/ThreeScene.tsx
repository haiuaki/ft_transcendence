"use client";

import { useEffect, useRef, useState } from "react";
import { createScene } from "./scene/createScene";
import type { SwitchMode, TextureMode } from "./scene/types";
import SceneLoading from "./ui/SceneLoading";
import SceneWindows from "./ui/SceneWindows";
import { ArrowUp, MessageCircle, X } from "lucide-react";
import { useSocket } from "@/src/context/SocketContext";
import chatService, { Message } from "@/src/services/chatService";
import roomService from "@/src/services/roomService";
import { toast } from "sonner";
import decodeHtml from "@/src/lib/decodeHtml";
import { useAuth } from "@/src/context/AuthContext";
import Link from "next/link";
import { useRoomControls, useRoomControlsActions } from "@/src/context/RoomControlsContext";


const RoomChat = ({ roomId }: { roomId?: string }) => {
	const [open, setOpen] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [content, setContent] = useState<string>("");
	const { send, subscribe } = useSocket();
	const { user, token } = useAuth();
	const [messages, setMessages] = useState<Message[]>([]);

	const bottomRef = useRef<HTMLDivElement | null>(null);
	const lastSentRef = useRef<string | null>(null);
	const retriedRef = useRef(false);

	useEffect(() => {
		if (!token || !roomId) return;
		chatService.messages(token, Number(roomId))
			.then(setMessages)
			.catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load messages"));
	}, [token, roomId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, open]);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
	}, [content]);

	useEffect(() => {
		return subscribe((data) => {
			if (data.type === "chat_error" && data.payload.room_id === Number(roomId)) {
				const failed = lastSentRef.current;
				lastSentRef.current = null;
				// we were seated out of the room (socket drop, other tab): sit back down and resend once
				if (data.payload.code === "not_in_room" && failed && token && !retriedRef.current) {
					retriedRef.current = true;
					roomService.join(token, String(roomId), undefined)
						.then(() => send({ type: "chat", payload: { room_id: Number(roomId), message: failed } }))
						.catch(() => {
							setContent((current) => current || failed);
							toast.error(data.payload.message);
						});
					return;
				}
				if (failed) setContent((current) => current || failed);
				toast.error(data.payload.message);
				return;
			}
			if (data.type !== "chat" || data.payload.room_id !== Number(roomId)) return;
			if (data.payload.username === user?.username) {
				lastSentRef.current = null;
				retriedRef.current = false;
			}
			setMessages((prev) => prev.some((m) => m.id === data.payload.id) ? prev : [...prev, data.payload]);
		});
	}, [roomId, subscribe, token, send, user?.username]);

	const sendMessage = () => {
		if (!content.trim()) return;
		if (!send({ type: "chat", payload: { room_id: Number(roomId), message: content } })) return toast.error("Not connected to chat");
		lastSentRef.current = content;
		setContent("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
			e.preventDefault();
			sendMessage();
		}
	}
	console.log(messages)
	return (
		<div
			onClick={() => !open && setOpen(true)}
			className={`fixed ring-1 ring-ui-line shadow-md z-10 bg-white overflow-hidden transition-all duration-300 ease-in-out ${open ? "bottom-5 right-5 w-[400px] h-[550px] rounded-xl" : "bottom-5 right-5 h-9 w-20 rounded-md cursor-pointer hover:bg-black/5"}`} >
			{!open ? (
				<div className="w-full h-full flex items-center justify-center gap-2 bg-white">
					<MessageCircle size={16} />
					<p className="font-semibold">Chat</p>
				</div>
			) : (
				<div className="p-4 h-full flex flex-col justify-between">
					<div className="flex-1 min-h-0 flex flex-col gap-2">
						<button className="cursor-pointer w-fit p-1 rounded-md hover:bg-black/5" onClick={() => setOpen(false)}><X size={16} /></button>
						<div className="h-[0.5px] w-full bg-ui-line" />
						<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-none flex flex-col gap-1 pr-1">
							{messages.map((msg, idx) => {
								const prev = messages[idx - 1];
								const next = messages[idx + 1];
								const date = new Date(msg.created_at);
								const isMine = msg.username === user?.username;
								const sameAsNext = next && next.username === msg.username;

								return (
									<div key={msg.id} className={`flex flex-col max-w-[75%] ${isMine ? "self-end items-end" : "self-start items-start"}`}>
										{!isMine && prev?.username !== msg.username && (
											<Link href={`/profile?username=${msg.username}`} target="_blank" className="ml-1 mb-0.5 text-xs text-black/40 hover:underline">{msg.username}</Link>
										)}
										<p className={`px-3 py-2 text-sm whitespace-pre-wrap [overflow-wrap:anywhere] rounded-2xl ${isMine ? "bg-black text-white rounded-br-md" : "bg-ui-soft rounded-bl-md"}`}>
											{decodeHtml(msg.content)}
										</p>
										{!sameAsNext && (
											<p className="mt-1 mb-2 text-[10px] text-black/40">
												{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
											</p>
										)}
									</div>
								);
							})}
							<div ref={bottomRef} />
						</div>
					</div>
					<div className="shrink-0 flex items-end gap-2 ring ring-ui-line p-2 pl-4 rounded-3xl">
						<textarea
							className="flex-1 w-full resize-none outline-none text-sm py-1.5 overflow-y-auto custom-scrollbar-none"
							rows={1}
							ref={textareaRef}
							placeholder="Write a message…"
							value={content}
							maxLength={500}
							onChange={(e) => setContent(e.target.value)}
							onKeyDown={handleKeyDown}
						/>
						<div onClick={sendMessage} className="shrink-0 flex items-center justify-center cursor-pointer rounded-full h-8 w-8 bg-black hover:bg-black/80 text-white">
							<ArrowUp size={16} />
						</div>
					</div>

				</div>
			)}
		</div>


	)
}

export default function ThreeScene({ roomId = null, onLeave }: { roomId?: string | null, onLeave?: () => void }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const switchModeRef = useRef<SwitchMode | null>(null);
	const [textureMode, setTextureMode] = useState<TextureMode>("day");
	const [texturesLoading, setTexturesLoading] = useState(true);
	// texturesLoading goes back to true on every mode switch; the chat must outlive that
	const [sceneLoadedOnce, setSceneLoadedOnce] = useState(false);

	useEffect(() => {
		if (!texturesLoading) {
			setSceneLoadedOnce(true);
		}
	}, [texturesLoading]);
	const [texturesReady, setTexturesReady] = useState(false);
	const [transitioning, setTransitioning] = useState(false);
	const [textureError, setTextureError] = useState<string | null>(null);

	const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
	const { setControls, setPanelOpen } = useRoomControlsActions();

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const scene = createScene(container, {
			setTextureMode,
			setTexturesLoading,
			setTexturesReady,
			setTransitioning,
			setTextureError,
			setSelectedGroup: (group) => {
				if (group === "menu") {
					setPanelOpen(true);
					return;
				}
				setSelectedGroup(group);
			},
		});
		switchModeRef.current = scene.switchMode;

		return () => {
			switchModeRef.current = null;
			scene.dispose();
		};
	}, [setPanelOpen]);

	function closeWindow(): void {
		setSelectedGroup(null);
	}

	const { nightMode } = useRoomControls();
	const textureModeRef = useRef(textureMode);

	useEffect(() => {
		textureModeRef.current = textureMode;
	}, [textureMode]);

	// the panel toggle drives the scene. The initial preload runs its own switchMode("day"), which makes
	// switchMode ignore calls until it ends, so we also re-check once loading/transition settle
	useEffect(() => {
		if (!texturesReady || texturesLoading || transitioning) {
			return;
		}
		const wanted: TextureMode = nightMode ? "night" : "day";
		if (textureModeRef.current === wanted) {
			return;
		}
		void switchModeRef.current?.(wanted);
	}, [nightMode, texturesReady, texturesLoading, transitioning]);

	useEffect(() => {
		if (!roomId) {
			return;
		}
		setControls({
			ready: texturesReady && !transitioning,
			onLeave,
		});
	}, [roomId, texturesReady, transitioning, onLeave, setControls]);

	useEffect(() => {
		if (!roomId) {
			return;
		}
		return () => {
			setControls(null);
			setPanelOpen(false);
		};
	}, [roomId, setControls, setPanelOpen]);

	return (
		<>
			<div className="relative isolate h-full w-full overflow-hidden">
				<div
					ref={containerRef}
					className="three-scene"
					aria-busy={texturesLoading}
				/>
				{texturesLoading && <SceneLoading />}
			</div>

			{sceneLoadedOnce && roomId && <RoomChat roomId={roomId} />}

			<SceneWindows roomId={roomId} selectedGroup={selectedGroup} onClose={closeWindow} />
		</>
	);
}
