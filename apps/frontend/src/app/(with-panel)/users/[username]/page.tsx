"use client"

import ProfileView from "@/src/components/profile/profileView";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Send the back button to wherever the profile was opened from
function UserProfileContent() {
  const { username } = useParams<{ username: string }>();
  const from = useSearchParams().get("from");
  const backHref = from === "chat" ? `/chat/${username}` : "/friends";
  return <ProfileView username={username} backHref={backHref} />;
}

export default function UserProfile() {
  return (
    <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
      <UserProfileContent />
    </Suspense>
  );
}
