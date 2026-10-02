import { ArrowUp } from 'lucide-react';

type KewanProps = {
    onClose: () => void;
};

export default function KewanWindow({ onClose }: KewanProps) {
    return (
        <div className="fixed top-5 right-5 z-[9999] w-[420px] rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/10">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-semibold text-black">
                        Kewan AI
                    </h2>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-black/50 transition-all duration-200 hover:bg-black/5 hover:text-black"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-sm leading-6 text-black/60">
                    Welcome to Kewan AI.
                </p>
                    <div className="w-full ring-2 ring-black/30 shadow-lg rounded-xl" >
                        <textarea className="resize-none text-black w-full p-2 outline-none" maxLength={150} placeholder="Type your message here..." />
                        <div className="flex items-center justify-end w-full p-1">
                        <div className="rounded-full bg-black p-1 flex items-center justify-center">
                        <ArrowUp size={16} />
                        </div>
                        </div>
                    </div>
            </div>
        </div>
    );
}
