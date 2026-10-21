"use client"

import Image, { ImageProps } from "next/image";
import { useState } from "react";

export const DEFAULT_AVATAR = "/img/avatar.jpg";

type AvatarProps = Omit<ImageProps, "src"> & { src?: string | null };

// Remote avatars (Google, 42...) can refuse hotlinked requests, so send no referrer
// and fall back to the default picture instead of showing a broken image
export default function Avatar({ src, alt, ...props }: AvatarProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const resolvedSrc = !src || src === failedSrc ? DEFAULT_AVATAR : src;

    return (
        <Image
            {...props}
            src={resolvedSrc}
            alt={alt}
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => { if (resolvedSrc !== DEFAULT_AVATAR) setFailedSrc(resolvedSrc); }}
        />
    );
}
