import { motion } from "motion/react"
import { CSSProperties, ReactNode, RefObject, useCallback, useEffect } from "react";
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  type Placement
} from "@floating-ui/react";

interface DynamicModalTemplateProps {
    onClose: () => void;
    children: ReactNode,
    className ?: string,
    style?: CSSProperties | undefined,
    ref: RefObject<HTMLElement | null>;
    placement?: Placement,
}

export default function DynamicModalTemplate({ onClose, children, className = "", style = undefined, ref, placement = "bottom-start" }: DynamicModalTemplateProps) {
   const {refs: floatingRefs, floatingStyles, context} = useFloating({
    open:true,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    placement,
    strategy: "fixed",
    transform: false,
    middleware: [
        offset(8),
        flip(),
        shift({padding:8}),
    ],
    whileElementsMounted: autoUpdate,
   })

   useEffect(() => {
    floatingRefs.setReference(ref.current);
   }, [ref, floatingRefs]);

   const setFloating = useCallback((node: HTMLElement | null) => {
    floatingRefs.setFloating(node);
   }, [floatingRefs]);

   const dismiss = useDismiss(context);
   const { getFloatingProps } = useInteractions([dismiss]);

   return <FloatingPortal>
    <motion.div
        ref={setFloating}
        {...getFloatingProps()}
        initial={{opacity:0, scale: 0.95}}
        animate={{opacity:1, scale: 1}}
        exit={{opacity:0, scale: 0.95}}
        transition={{duration: 0.1}}
        className={`z-[1000] ${className}`}
        style={{
            ...floatingStyles,
            ...style,
        }}
        >
        {children}
    </motion.div>
    </FloatingPortal>
}
