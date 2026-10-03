import { ReactNode } from "react";

interface InfoViewProps {
    icon: ReactNode;
    text: string | null;
}


const InfoView = ({ icon, text }: InfoViewProps) => {
    return (
        <div className="h-full flex flex-col gap-2 items-center justify-center">
            {icon}
            <p className="font-semibold text-sm">{text}</p>
        </div>
    )
}

export default InfoView