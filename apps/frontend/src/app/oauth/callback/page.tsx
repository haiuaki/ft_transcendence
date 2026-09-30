"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TbLoader2 } from "react-icons/tb";

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        // Grab the token from the URL (e.g. ?token=xxxxx)
        const token = searchParams.get("token");

        if (token) {
            // Save in localStorage
            localStorage.setItem("token", token);
            
            // Force a full redirect to the homepage. 
            window.location.href = "/";
        } else {
            // If something went wrong, just send them back
            window.location.href = "/";
        }
    }, [searchParams]);

	// Spinning wheel while loading token
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <TbLoader2 className="animate-spin text-4xl text-gray-500" />
        </div>
    );
}
