import { AnimatePresence } from "motion/react";
import CenterModalTemplate from "../TemplateModal/CenterModalTemplate";
import { ChangeEventHandler, Dispatch, SetStateAction, useRef, useState } from "react";
import SignUpView from "./SignUpView";
import { ArrowLeft, Eye, EyeClosed, Loader2, X } from "lucide-react"
import CreateUsernameView from "./CreateUsernameView";
import CreatePasswordView from "./CreatePasswordView";
import { motion } from "motion/react"
import LogInView from "./LogInView";
import { themeColors } from "@/src/lib/themeColors";

interface AuthModalProps {
    onClose: () => void;
    isOpen: boolean;
    view: "sign_up" | "log_in";
}

export interface AuthFormData {
    email: string,
    username: string,
    password: string,
    code: string,
}

export type StepAuthView = "sign_up" | "log_in" | "forgot_password" | "create_password" | "create_username" | "verify_code" | "confirm_account";

export type SetAuthFormData =
    Dispatch<SetStateAction<AuthFormData>>;

interface InputFieldProps {
    placeholder: string,
    type?: string,
    onChange: ChangeEventHandler<HTMLInputElement>;
    value: string,
    maxLength?: number | undefined,
    autoFocus?: boolean,
    error?: boolean,
}

interface ButtonAuthProps {
    disabled: boolean,
    isLoading: boolean,
    text: string,
    textAction: string,
    onPress: () => void | Promise<void>;
}


export const InputField = ({ placeholder, type = "text", onChange, value, maxLength = undefined, autoFocus = false, error = false }: InputFieldProps) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const refInput = useRef<HTMLInputElement | null>(null);
    const colors = themeColors;
    return (
        <div onClick={() => refInput.current?.focus()} className={`relative flex items-center w-full rounded-xl ring-1 ${error ? "ring-red-500/30 focus-within:ring-red-500/70" : "ring-black/30 focus-within:ring-black/70"} transition-all duration-200 text-black`}>
            <motion.p
                initial={false}
                animate={{ y: isFocused || value.length > 0 ? -12 : 0, scale: isFocused || value.length > 0 ? 0.80 : 1 }}
                transition={{ duration: 0.15, bounce: 0 }}
                className={`pointer-events-none absolute left-0 origin-left ml-4 text-base font-medium ${error ? "text-red-500" : colors.textSecondary}`}>
                {placeholder}
            </motion.p>
            <input
                ref={refInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus={autoFocus} value={value}
                type={type == "password" && showPassword ? "text" : type}
                maxLength={maxLength}
                className="w-full outline-none px-4 pt-7 pb-2 autofill:bg-transparent"
                onChange={onChange} />
            {type == "password" && <div onClick={() => setShowPassword(!showPassword)} className="mr-4">
                {showPassword ? <Eye className="cursor-pointer" size={16} /> : <EyeClosed className="cursor-pointer" size={16} />}
            </div>}
        </div>
    )
}

export const ButtonAuth = ({ disabled, isLoading, onPress, text, textAction }: ButtonAuthProps) => {
    return (
        <button
            disabled={disabled}
            className={`select-none w-full flex items-center gap-2 justify-center p-3 rounded-xl cursor-pointer ${disabled ? "bg-black/80" : "bg-black hover:bg-black/85 active:bg-black/90 active:scale-99"} text-white font-medium`}
            onClick={onPress}
        >
            {isLoading ? <Loader2 className="animate-spin" /> : null}
            <p className="font-semibold"> {isLoading ? textAction : text}</p>
        </button>
    )
}

export const AuthModal = ({ onClose, isOpen, view }: AuthModalProps) => {
    const [currentAuthView, setCurrentAuthView] = useState<StepAuthView>(view)
    const [authViewHistory, setAuthViewHistory] = useState<StepAuthView[]>([])
    const [authFormData, setAuthFormData] = useState<AuthFormData>({ email: "", username: "", password: "", code: "", })
    const colors = themeColors;

    const goBack = () => {
        const previousView = authViewHistory.at(-1);
        if (!previousView) return;
        setCurrentAuthView(previousView);
        setAuthViewHistory((history) => history.slice(0, -1));
    }

    const goToView = (nextView: StepAuthView) => {
        setAuthViewHistory((history) => [...history, currentAuthView])
        setCurrentAuthView(nextView)
    }

    const closeModal = () => {
        setCurrentAuthView(view);
        setAuthViewHistory([]);
        setAuthFormData({
            email: "",
            username: "",
            password: "",
            code: "",
        });

        onClose();
    };
    return (
        <AnimatePresence>
            {isOpen && <CenterModalTemplate onClose={closeModal} className={`flex w-full h-full max-w-[550px] max-h-[480px] flex-col pt-4 rounded-4xl bg-white ${colors.text}`} overlay="bg-black/75 backdrop-blur-sm">
                <div className="flex items-center justify-between px-4">
                    {authViewHistory.length > 0 && currentAuthView != "confirm_account" ? <div className="cursor-pointer flex items-center justify-center p-1.5 hover:bg-black/5 active:bg-black/10 transition-colors duration-200 rounded-full text-black" onClick={goBack}>
                        <ArrowLeft size={20} />
                    </div> : <div />}
                    <div className="cursor-pointer flex items-center justify-center p-1.5 hover:bg-black/5 active:bg-black/10 transition-colors duration-200 rounded-full text-black" onClick={closeModal}>
                        <X size={20} />
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-6">
                    <div className="h-full w-full max-w-[450px]">
                        {currentAuthView == "sign_up" && <SignUpView onNextStep={goToView} authFormData={authFormData} setAuthFormData={setAuthFormData} />}
                        {currentAuthView == "log_in" && <LogInView authFormData={authFormData} setAuthFormData={setAuthFormData} onClose={closeModal} />}
                        {currentAuthView == "create_password" && <CreatePasswordView authFormData={authFormData} setAuthFormData={setAuthFormData} onClose={closeModal} />}
                        {currentAuthView == "create_username" && <CreateUsernameView onNextStep={goToView} authFormData={authFormData} setAuthFormData={setAuthFormData} />}
                    </div>
                </div>
            </CenterModalTemplate>
            }
        </AnimatePresence>
    )
}
