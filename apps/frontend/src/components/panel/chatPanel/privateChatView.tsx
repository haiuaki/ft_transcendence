import colorTheme from "@/src/lib/color";
import { IoMdArrowBack } from "react-icons/io";
import { CHAT_EXAMPLE, ChatPanelView, UserStatus } from "./chatPanel";

export default function PrivateChatView({ setChatPanelView, selectedUserId }: { setChatPanelView: React.Dispatch<React.SetStateAction<ChatPanelView>>, selectedUserId: number }) {
    const colors = colorTheme();
    const user = CHAT_EXAMPLE.find((u) => u.id == selectedUserId)
    if (!user)
        return null;
    return (
        <div className="flex flex-col gap-4 overflow-hidden h-full">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center cursor-pointer hover:bg-white/10 duration-200 p-1 rounded-md active:scale-95" onClick={() => setChatPanelView(ChatPanelView.CHAT_HOME)}>
                        <IoMdArrowBack size={18} color={colors.textColor} />
                    </div>
                            <div className="shrink-0 w-6 h-6 rounded-full relative">
                                <div
                                    className="w-full h-full rounded-full overflow-hidden bg-center bg-cover bg-no-repeat"
                                    style={{ backgroundImage: `url(${user.image})` }}
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-2 border-black flex items-center justify-center" style={{backgroundColor: user.status == UserStatus.ONLINE ? "#00c951" : "#707070"}}>
                                    {UserStatus.OFFLINE == user.status && <div className="w-1 h-1 rounded-full bg-black"/>}
                                </div>
                            </div>

                    <h1 className="text-xl font-playfair-display" style={{ color: colors.textColor }}>{user.name}</h1>
                </div>
            </div>
            <div className="flex-1"/>
            <div className="flex items-center gap-2 border border-white/20 rounded-lg h-10 px-2 custom-scrollbar" style={{ color: colors.textColorSecondary }}>
                <textarea placeholder="Ecrire un message" className="outline-none w-full resize-none" />
            </div>
        </div>
    )
}
