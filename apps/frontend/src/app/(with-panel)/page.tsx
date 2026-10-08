"use client"

import ThreeScene from "../../components/3D/ThreeScene";
import { Suspense } from "react";

function HomeContent() {
  return (
    <div className="scene-page">
      <ThreeScene />
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
