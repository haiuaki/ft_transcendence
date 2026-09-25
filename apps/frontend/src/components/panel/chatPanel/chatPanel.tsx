import React, { useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { IoMdArrowBack } from "react-icons/io";

import { motion } from "motion/react"
import colorTheme from "@/src/lib/color";
import { CgSearch } from "react-icons/cg";
import { LuListFilter } from "react-icons/lu";

interface ChatPanelProps {
    isOpen: boolean;
    onClose: any;
}

enum STATUS {
    ONLINE = 0,
    PASLA = 0,
}

const CHAT_EXAMPLE = [
    {
        id: 482731,
        image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1160&auto=format&fit=crop",
        name: "Camille",
        lastMessage: "Tu es disponible ce soir ?",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 915264,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1160&auto=format&fit=crop",
        name: "Hugo",
        lastMessage: "La partie commence dans 5 minutes.",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 367849,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1160&auto=format&fit=crop",
        name: "Lina",
        lastMessage: "Bien joue !",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 724156,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1160&auto=format&fit=crop",
        name: "Noah",
        lastMessage: "On se retrouve dans le lobby.",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 158493,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1160&auto=format&fit=crop",
        name: "Chloe",
        lastMessage: "Merci pour la partie !",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 639278,
        image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=1160&auto=format&fit=crop",
        name: "Leo",
        lastMessage: "Tu as vu le nouveau classement ?",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 846321,
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1160&auto=format&fit=crop",
        name: "Maya",
        lastMessage: "A bientot !",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 271958,
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1160&auto=format&fit=crop",
        name: "Emma",
        lastMessage: "Tu veux rejoindre notre equipe ?",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 593814,
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1160&auto=format&fit=crop",
        name: "Lucas",
        lastMessage: "Je viens de me connecter.",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 418726,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1160&auto=format&fit=crop",
        name: "Sarah",
        lastMessage: "On joue une partie ?",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 762935,
        image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=1160&auto=format&fit=crop",
        name: "Adam",
        lastMessage: "Le tournoi commence demain.",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 934167,
        image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=1160&auto=format&fit=crop",
        name: "Ines",
        lastMessage: "Je t'envoie une invitation.",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 285749,
        image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=1160&auto=format&fit=crop",
        name: "Jules",
        lastMessage: "Quel est ton meilleur score ?",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 671402,
        image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1160&auto=format&fit=crop",
        name: "Manon",
        lastMessage: "Je suis dans le salon principal.",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 357826,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1160&auto=format&fit=crop",
        name: "Theo",
        lastMessage: "Bien recu, merci.",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 809513,
        image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=1160&auto=format&fit=crop",
        name: "Eva",
        lastMessage: "A demain pour la revanche !",
        status: STATUS.ONLINE,
        messageState: "",
    },
    {
        id: 526948,
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1160&auto=format&fit=crop",
        name: "Nathan",
        lastMessage: "Je regarde ca tout de suite.",
        status: STATUS.ONLINE,
        messageState: "",
    },
];

enum StateChatPanel {
    HOME = 0,
    PRIVATE_CHAT = 1,
}

const Home = ({ setStateChatPanel, onClose, setId }: { setStateChatPanel: React.Dispatch<React.SetStateAction<StateChatPanel>>, onClose: any, setId: React.Dispatch<React.SetStateAction<number | null>> }) => {
    const colors = colorTheme();
    return (
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-playfair-display" style={{ color: colors.textColor }}>Messagerie</h1>
                <div className="cursor-pointer hover:bg-white/10 duration-200 p-1 rounded-md active:scale-95" onClick={onClose}>
                    <IoCloseOutline size={20} color="white" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 border border-white/20 rounded-md h-8 px-2" style={{ color: colors.textColorSecondary }}>
                    <CgSearch size={14} />
                    <input placeholder="Rechercher" className="outline-none" />
                </div>
                <div className="cursor-pointer hover:bg-white/10 flex items-center justify-center rounded-md border-[1px] border-white/20 h-8 w-8">
                    <LuListFilter size={15} />
                </div>
            </div>
            <div className="flex flex-col items-start overflow-y-auto min-h-0 custom-scrollbar-none">
                {CHAT_EXAMPLE.map((item) => (
                    <div key={item.id} className="truncate shrink-0 cursor-pointer w-full flex justify-between items-center hover:bg-white/10 p-3 rounded-lg active:scale-[0.99]" onClick={() => {
                        setStateChatPanel(StateChatPanel.PRIVATE_CHAT);
                        setId(item.id)
                    }}>
                        <div className="flex items-center gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-full relative">
                                <div
                                    className="w-full h-full rounded-full overflow-hidden bg-center bg-cover bg-no-repeat"
                                    style={{ backgroundImage: `url(${item.image})` }}
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-2 border-black" />
                            </div>
                            <div className="flex-1 min-w-0 select-none">
                                <p className="text-md truncate font-semibold">{item.name}</p>
                                <p className="text-sm truncate " style={{ color: colors.textColorSecondary }}>{item.lastMessage}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const PrivateChat = ({ setStateChatPanel, userId }: { setStateChatPanel: React.Dispatch<React.SetStateAction<StateChatPanel>>, userId: number }) => {
    const colors = colorTheme();
    const user = CHAT_EXAMPLE.find((u) => u.id == userId)
    if (!user)
        return null;
    return (
        <div className="flex flex-col gap-4 overflow-hidden h-full">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center cursor-pointer hover:bg-white/10 duration-200 p-1 rounded-md active:scale-95" onClick={() => setStateChatPanel(StateChatPanel.HOME)}>
                        <IoMdArrowBack size={18} color={colors.textColor} />
                    </div>
                            <div className="shrink-0 w-6 h-6 rounded-full relative">
                                <div
                                    className="w-full h-full rounded-full overflow-hidden bg-center bg-cover bg-no-repeat"
                                    style={{ backgroundImage: `url(${user.image})` }}
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-2 border-black" />
                            </div>

                    <h1 className="text-xl font-playfair-display" style={{ color: colors.textColor }}>{user.name}</h1>
                </div>
            </div>
            <div className="flex-1"/>
            <div className="flex items-center gap-2 border border-white/20 rounded-lg h-10 px-2 custom-scrollbar" style={{ color: colors.textColorSecondary }}>
                <textarea placeholder="Ecrire un message" className="outline-none w-full" />
            </div>
        </div>
    )
}
export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
    if (!isOpen) return null;
    const [stateChatPanel, setStateChatPanel] = useState<StateChatPanel>(StateChatPanel.HOME)
    const [userId, setUserId] = useState<number | null>(null)
    const colors = colorTheme();
    return (
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col w-1/4 rounded-lg m-4 p-4 transition-colors " style={{ backgroundColor: colors.bakgroundPanel }}>
            {stateChatPanel == StateChatPanel.HOME && <Home setStateChatPanel={setStateChatPanel} onClose={onClose} setId={setUserId} />}
            {stateChatPanel == StateChatPanel.PRIVATE_CHAT && userId && <PrivateChat setStateChatPanel={setStateChatPanel} userId={userId} />}
        </motion.div>
    )
}