import React, { useState } from "react";

import { motion } from "motion/react"
import { themeColors } from "@/src/lib/themeColors";
import PrivateChatView from "./PrivateChatView";
import HomeChatView from "./HomeChatView";

interface ChatPanelProps {
    isOpen: boolean;
    onClose: any;
}

export enum UserStatus {
    ONLINE = 0,
    OFFLINE = 1,
}

export enum ChatPanelView {
    CHAT_HOME = 0,
    PRIVATE_CHAT = 1,
}

import { CHAT_EXAMPLE } from "@/src/constants/mockData";

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
    const [chatPanelView, setChatPanelView] = useState<ChatPanelView>(ChatPanelView.CHAT_HOME)
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
    const colors = themeColors;
    if (!isOpen) return null;
    return (
        <motion.div initial={{ x: 200 }} animate={{ x: 0 }} transition={{ duration: 0.4 }} className="flex flex-col w-1/4 p-4 transition-colors h-screen" style={{ backgroundColor: colors.bakgroundPanel }}>
            {chatPanelView == ChatPanelView.CHAT_HOME && <HomeChatView setChatPanelView={setChatPanelView} onClose={onClose} setSelectedUserId={setSelectedUserId} />}
            {chatPanelView == ChatPanelView.PRIVATE_CHAT && selectedUserId && <PrivateChatView setChatPanelView={setChatPanelView} selectedUserId={selectedUserId} />}
        </motion.div>
    )
}