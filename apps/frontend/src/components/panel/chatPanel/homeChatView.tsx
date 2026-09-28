import colorTheme from "@/src/lib/color";
import { CgSearch } from "react-icons/cg";
import { IoCloseOutline } from "react-icons/io5";
import { LuListFilter } from "react-icons/lu";
import { CHAT_EXAMPLE, ChatPanelView, UserStatus } from "./chatPanel";

export default function HomeChatView({ setChatPanelView, onClose, setSelectedUserId }: { setChatPanelView: React.Dispatch<React.SetStateAction<ChatPanelView>>, onClose: any, setSelectedUserId: React.Dispatch<React.SetStateAction<number | null>> }) {
    const colors = colorTheme();
    return (
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl" style={{ color: colors.text }}>Messagerie</h1>
                <div className="cursor-pointer hover:bg-white/10 duration-200 p-1 rounded-md active:scale-95" onClick={onClose}>
                    <IoCloseOutline size={20} color="white" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 border border-white/20 rounded-md h-8 px-2" style={{ color: colors.textColorSecondary }}>
                    <CgSearch size={14} />
                    <input placeholder="Rechercher" className="outline-none w-full" />
                </div>
                <div className="cursor-pointer hover:bg-white/10 flex items-center justify-center rounded-md border-[1px] border-white/20 h-8 w-8">
                    <LuListFilter size={15} />
                </div>
            </div>
            <div className="flex flex-col items-start overflow-y-auto min-h-0 custom-scrollbar-none select-none">
                {CHAT_EXAMPLE.map((item) => (
                    <div key={item.id} className="truncate shrink-0 cursor-pointer w-full flex justify-between items-center hover:bg-white/10 p-3 rounded-lg active:scale-[0.99]" onClick={() => {
                        setChatPanelView(ChatPanelView.PRIVATE_CHAT);
                        setSelectedUserId(item.id)
                    }}>
                        <div className="flex items-center gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-full relative">
                                <div
                                    className="w-full h-full rounded-full overflow-hidden bg-center bg-cover bg-no-repeat"
                                    style={{ backgroundImage: `url(${item.image})` }}
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-2 border-black flex items-center justify-center" style={{backgroundColor: item.status == UserStatus.ONLINE ? "#00c951" : "#707070"}}>
                                    {UserStatus.OFFLINE == item.status && <div className="w-1 h-1 rounded-full bg-black"/>}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 select-none">
                                <p className="text-md truncate font-semibold">{item.name}</p>
                                <p className="text-sm truncate " style={{ color: colors.textSecondary }}>{item.lastMessage}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
