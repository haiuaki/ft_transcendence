"use client"

import HomeScene from "../../components/3D/HomeScene";
import { Suspense } from "react";

function HomeContent() {
  return (
    <div className="scene-page">
      <HomeScene />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-black"></div>}>
      <HomeContent />
    </Suspense>
  );
}
