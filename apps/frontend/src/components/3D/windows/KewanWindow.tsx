'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Pin, PinOff } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';

type KewanProps = {
    onClose: () => void;
};

const GREETINGS = [
    "How can I help you ?",
    "What's on your mind today ?",
    "Where should we begin ?",
    "What's on the agenda today ?",
    "Ready when you are.",
];

export default function KewanWindow({ onClose }: KewanProps) {
    const dragControls = useDragControls();
    const windowRef = useRef<HTMLDivElement>(null);
    const [message, setMessage] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [greeting] = useState(() => {
        return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    });

    useEffect(() => {
        const savedDraft = sessionStorage.getItem('kewan_ai_draft');
        if (savedDraft) {
            setMessage(savedDraft);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setMessage(val);
        sessionStorage.setItem('kewan_ai_draft', val);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isPinned) {
                return;
            }
            if (windowRef.current && !windowRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, isPinned]);

    return (
        <motion.div
            ref={windowRef}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            className="fixed top-5 left-5 z-[9999] w-[420px] rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/10"
        >
            <div className="flex flex-col gap-6">
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="flex cursor-grab active:cursor-grabbing select-none items-center justify-between"
                >
                    <h2 className="text-3xl font-semibold text-black">
                        Kewan AI
                    </h2>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setIsPinned((prev) => !prev)}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                                isPinned
                                    ? 'bg-black text-white hover:bg-black/80'
                                    : 'text-black/50 hover:bg-black/5 hover:text-black'
                            }`}
                            title={isPinned ? 'Unpin window' : 'Pin window'}
                        >
                            {isPinned ? (
                                <PinOff strokeWidth={1.5} size={18} />
                            ) : (
                                <Pin strokeWidth={1.5} size={18} />
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-black/50 transition-all duration-200 hover:bg-black/5 hover:text-black cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <p className="text-sm leading-6 text-black/60">
                    {greeting}
                </p>
                <div className="w-full ring-2 ring-black/30 shadow-lg rounded-xl">
                    <textarea 
                        className="resize-none text-black w-full p-2 outline-none" 
                        maxLength={150} 
                        placeholder="Type your message here..." 
                        value={message}
                        onChange={handleChange}
                    />
                    <div className="flex items-center justify-end w-full p-1">
                        <div className="rounded-full bg-black p-1 flex items-center justify-center cursor-pointer">
                            <ArrowUp size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

