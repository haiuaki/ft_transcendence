"use client";

import ChatContent from "@/src/components/chat/ChatContent";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChatPageContent() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const backHref = useSearchParams().get("from") === "profile" ? `/users/${username}` : "/friends";
  return <ChatContent username={username} backHref={backHref} />;
}

export default function Chat() {
  return <Suspense fallback={<Loader2 className="m-auto animate-spin" />}><ChatPageContent /></Suspense>;
}
