"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TbLoader2 } from "react-icons/tb";

function OAuthCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // Grab the token from the URL (e.g. ?token=xxxxx)
        const token = searchParams.get("token");

        if (token) {
            // Save in localStorage
            localStorage.setItem("token", token);
            
        }

        router.replace("/");
    }, [router, searchParams]);

	// Spinning wheel while loading token
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <TbLoader2 className="animate-spin text-4xl text-gray-500" />
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><TbLoader2 className="animate-spin text-4xl text-gray-500" /></div>}>
            <OAuthCallbackContent />
        </Suspense>
    );
}
