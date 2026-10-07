import { createPortal } from "react-dom"
import { motion } from "motion/react"
import { CSSProperties, ReactNode } from "react";

interface CenterModalTemplateProps {
    onClose: () => void;
    children: ReactNode,
    className ?: string,
    style?: CSSProperties | undefined,
    overlay : string
}

export default function CenterModalTemplate({ onClose, children, className = "", style = undefined, overlay = "" }: CenterModalTemplateProps) {
    return createPortal(
    <div onClick={(e) => e.target === e.currentTarget ? onClose() : null} className={`fixed inset-0 z-999 flex items-center justify-center ${overlay} p-5`}>
        <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}} transition={{duration: 0.1}} className={className} style={style}>
            {children}
        </motion.div>
    </div>, document.body)
}