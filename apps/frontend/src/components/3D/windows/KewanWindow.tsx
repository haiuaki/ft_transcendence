'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2, Pin, PinOff, Trash2 } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { AI_DRAFT_KEY, AI_HISTORY_KEY, getAiDraftKey, getAiHistoryKey } from '@/src/lib/aiHistory';

type KewanProps = {
    isOpen?: boolean;
    onClose: () => void;
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const STORAGE_KEY = AI_HISTORY_KEY;
const DRAFT_KEY = AI_DRAFT_KEY;

const GREETINGS = [
    "How can I help you ?",
    "What's on your mind today ?",
    "Where should we begin ?",
    "What's on the agenda today ?",
    "Ready when you are.",
];

function renderFormattedText(text: string) {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return (
                <strong key={index} className="font-semibold text-black">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            return (
                <em key={index} className="italic text-black">
                    {part.slice(1, -1)}
                </em>
            );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            return (
                <code key={index} className="rounded bg-black/10 px-1 py-0.5 text-xs font-mono text-black">
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
}

export default function KewanWindow({ isOpen = true, onClose }: KewanProps) {
    const dragControls = useDragControls();
    const windowRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { token, user } = useAuth();
    const storageKey = getAiHistoryKey(user?.id);
    const draftKey = getAiDraftKey(user?.id);

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPinned, setIsPinned] = useState(false);
    const [greeting] = useState(() => {
        return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    });

    // Reload conversation history whenever active user changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!token || !user?.id) {
            setMessages([]);
            setMessage('');
            return;
        }

        const draft = sessionStorage.getItem(draftKey) || '';
        setMessage(draft);

        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setMessages(parsed);
                    return;
                }
            }
        } catch {
            // Ignore storage parse error
        }
        setMessages([]);
    }, [user?.id, token, storageKey, draftKey]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setMessage(val);
        sessionStorage.setItem(draftKey, val);
    };

    const handleClearHistory = () => {
        setMessages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && !isLoading && user?.id) {
            // Filter out empty placeholder assistant messages before saving
            const validMessages = messages.filter((m) => m.content.trim().length > 0);
            if (validMessages.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(validMessages));
            } else {
                localStorage.removeItem(storageKey);
            }
        }
    }, [messages, isLoading, storageKey, user?.id]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

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
    }, [onClose, isPinned, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const promptToSend = message.trim();
        if (!promptToSend || isLoading) return;
        if (!token) {
            setError('Log in to chat with the assistant.');
            return;
        }

        setMessage('');
        sessionStorage.removeItem(DRAFT_KEY);
        setError(null);

        setMessages((prev) => [
            ...prev,
            { role: 'user', content: promptToSend },
            { role: 'assistant', content: '' },
        ]);
        setIsLoading(true);

        try {
            const url = process.env.NEXT_PUBLIC_AI_URL
                ? `${process.env.NEXT_PUBLIC_AI_URL}/stream`
                : '/api/ai/stream';

            const historyPayload = messages
                .filter((m) => m.content.trim().length > 0)
                .slice(-10)
                .map((m) => ({
                    role: m.role,
                    content: m.content.slice(0, 500),
                }));

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    prompt: promptToSend,
                    history: historyPayload,
                }),
            });

            if (!response.ok) {
                let errorDetail = `Erreur ${response.status}`;
                try {
                    const errorText = await response.text();
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error) errorDetail = errorData.error;
                        else if (errorData.detail) errorDetail = errorData.detail;
                        else if (errorText) errorDetail = errorText;
                    } catch {
                        if (errorText) errorDetail = errorText;
                    }
                } catch {
                    // Fallback to HTTP status
                }
                throw new Error(errorDetail);
            }

            if (!response.body) {
                throw new Error('Réponse vide du serveur');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let assistantText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() ?? '';

                for (const part of parts) {
                    if (!part) continue;
                    const lines = part.split('\n');
                    for (const line of lines) {
                        let data = line;
                        if (data.startsWith('data: ')) {
                            data = data.slice(6);
                        } else if (data.startsWith('data:')) {
                            data = data.slice(5);
                        } else {
                            continue;
                        }

                        if (data === 'Done') continue;
                        if (data.startsWith('[ERROR:')) {
                            const cleanErr = data.replace(/^\[ERROR:\s*/, '').replace(/\]$/, '');
                            throw new Error(cleanErr);
                        }

                        assistantText += data;
                    }

                    setMessages((prev) => {
                        const next = [...prev];
                        const lastIdx = next.length - 1;
                        if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                            next[lastIdx] = { ...next[lastIdx], content: assistantText };
                        }
                        return next;
                    });
                }
            }

            if (buffer.trim()) {
                const lines = buffer.trim().split('\n');
                for (const line of lines) {
                    let data = line;
                    if (data.startsWith('data: ')) {
                        data = data.slice(6);
                    } else if (data.startsWith('data:')) {
                        data = data.slice(5);
                    } else {
                        continue;
                    }
                    if (data !== 'Done' && !data.startsWith('[ERROR:')) {
                        assistantText += data;
                    }
                }
                setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                        next[lastIdx] = { ...next[lastIdx], content: assistantText };
                    }
                    return next;
                });
            }
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Une erreur est survenue';
            setError(errMsg);
            setMessages((prev) => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (lastIdx >= 0 && next[lastIdx].role === 'assistant' && !next[lastIdx].content) {
                    return next.slice(0, -1);
                }
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
        }
    };

    return (
        <motion.div
            ref={windowRef}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            initial={{ opacity: 0, x: 100 }}
            animate={{
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : 60,
                pointerEvents: isOpen ? 'auto' : 'none',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed bottom-20 right-4 z-[9999] w-[420px] max-h-[85vh] rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 flex flex-col gap-4 ${
                !isOpen ? 'invisible' : ''
            }`}
        >
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex cursor-grab active:cursor-grabbing select-none items-center justify-between"
            >
                <h2 className="text-2xl font-semibold text-black">
                    Kewan AI
                </h2>

                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearHistory}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-black/50 transition-all duration-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            title="Effacer l'historique"
                        >
                            <Trash2 strokeWidth={1.5} size={18} />
                        </button>
                    )}

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
                        type="button"
                        onClick={onClose}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-black/50 transition-all duration-200 hover:bg-black/5 hover:text-black cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-72 custom-scrollbar flex flex-col gap-3 pr-1">
                {messages.length === 0 ? (
                    <p className="text-sm leading-6 text-black/60">
                        {greeting}
                    </p>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col ${
                                msg.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                        >
                            <div
                                className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] break-words leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-black text-white rounded-br-xs'
                                        : 'bg-ui-soft text-black rounded-bl-xs whitespace-pre-wrap'
                                }`}
                            >
                                {msg.content ? (
                                    msg.role === 'assistant' ? (
                                        renderFormattedText(msg.content)
                                    ) : (
                                        msg.content
                                    )
                                ) : (
                                    <div className="flex items-center gap-1.5 py-1 text-black/40">
                                        <Loader2 className="animate-spin" size={14} />
                                        <span className="text-xs">Generating response...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {error && (
                    <div className="rounded-xl bg-red-500/10 p-2.5 text-xs text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="w-full ring-2 ring-ui-line shadow-lg rounded-xl overflow-hidden focus-within:ring-black transition-all">
                <textarea 
                    className="resize-none text-black w-full p-2.5 outline-none block text-sm bg-transparent placeholder:text-black/40" 
                    maxLength={500} 
                    rows={2}
                    placeholder="Type your message here..." 
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <div className="flex items-center justify-between w-full px-2.5 pb-2 pt-1 bg-white">
                    <span className="text-[11px] text-black/40">
                        {message.length}/500
                    </span>
                    <button
                        type="submit"
                        disabled={isLoading || !message.trim()}
                        className="rounded-full bg-black text-white p-1.5 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/80 transition-all"
                        title="Send message"
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <ArrowUp size={16} />
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

