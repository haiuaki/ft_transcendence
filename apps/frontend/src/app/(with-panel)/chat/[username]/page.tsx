"use client"

import { useAuth } from "@/src/context/AuthContext";
import decodeHtml from "@/src/lib/decodeHtml";
import chatService, { Message } from "@/src/services/chatService";
import { ArrowUp, CircleX, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Chat() {
  const { token, user } = useAuth();
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const [content, setContent] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelId, setChannelId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  }

  useEffect(() => {
    if (!token) return
    const initMessage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { channel_id } = await chatService.startDM(token, username);
        setChannelId(channel_id);
        const history = await chatService.messages(token, channel_id);
        setMessages(history);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to open chat");
      } finally {
        setIsLoading(false);
      }
    }
    initMessage();
  }, [token, username])

  useEffect(() => {
    if (!token || !channelId) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/api/ws`)
    socketRef.current = socket;

    let closedByCleanup = false;
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", payload: { token } }));
      setIsConnected(true);
      setError(null);
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "chat" || data.payload.room_id !== channelId) return;
      setMessages((prev) => [...prev, data.payload]);
    };
    socket.onclose = () => {
      setIsConnected(false)
      if (!closedByCleanup) setError("Connection to chat lost. Refresh the page.");
    };
    return () => {
      closedByCleanup = true;
      socket.close()
    };
  }, [token, channelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages])

  const sendMessage = () => {
    const text = content.trim();
    if (!text || !channelId) return;
    if (socketRef.current?.readyState !== WebSocket.OPEN)
      return toast.error("Not connected to chat");
    socketRef.current.send(JSON.stringify({ type: "chat", payload: { room_id: channelId, message: text } }));
    setContent("");
  }

  return <div className="flex-1 min-h-0 flex flex-col items-center w-full p-5 pt-12 text-black">
    <div className="flex-1 min-h-0 flex flex-col gap-5 max-w-[550px] w-full">
      <h1 className="shrink-0 text-3xl font-semibold">{username}</h1>
      {isLoading && <div className="flex-1 flex flex-col items-center justify-center ">
        <Loader2 className="animate-spin" size={18}/>
        <p>loading...</p>
        </div>}
      {!isLoading && error && <div className="flex-1 flex flex-col items-center justify-center ">
        <CircleX size={18}/>
        <p>{error}</p>
        </div>}
      {!isLoading && !error &&
        <>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-none flex flex-col gap-1 pr-1">
            {messages.map((msg, idx) => {
              const next = messages[idx + 1];
              const date = new Date(msg.created_at);
              const isMine = msg.username === user?.username;
              const sameAsNext = next && next.username === msg.username;

              return (
                <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMine ? "self-end items-end" : "self-start items-start"}`}>
                  <p className={`px-3 py-2 text-sm whitespace-pre-wrap break-words rounded-2xl ${isMine ? "bg-black text-white rounded-br-md" : "bg-[#efefef] rounded-bl-md"}`}>
                    {decodeHtml(msg.content)}
                  </p>
                  {!sameAsNext && <p className="mt-1 mb-2 text-[10px] text-black/40">
                    {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <div className="shrink-0 flex items-end gap-2 ring ring-[#dedede] p-2 pl-4 rounded-3xl">
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
        </>
      }
    </div>
  </div>
}
