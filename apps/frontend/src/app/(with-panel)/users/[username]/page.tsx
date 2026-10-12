"use client"

import ProfileView from "@/src/components/profile/profileView";
import { useParams } from "next/navigation";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  return <ProfileView username={username} />;
}
