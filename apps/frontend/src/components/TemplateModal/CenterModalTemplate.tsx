import { createPortal } from "react-dom"
import { motion } from "motion/react"

interface CenterModalTemplateProps {
    onClose: any,
    children: any,
    className ?: any,
    style?: any,
    overlay : string
}

export default function CenterModalTemplate({ onClose, children, className = "", style = null, overlay = "" }: CenterModalTemplateProps) {
    return createPortal(
    <div onClick={(e) => e.target === e.currentTarget ? onClose() : null} className={`fixed inset-0 z-999 flex items-center justify-center ${overlay}`}>
        <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}} transition={{duration: 0.1}} className={className} style={style}>
            {children}
        </motion.div>
    </div>, document.body)
}