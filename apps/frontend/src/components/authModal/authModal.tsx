import { AnimatePresence } from "motion/react";
import CenterModalTemplate from "../templateModal/centerModalTemplate";
import { useEffect, useState } from "react";
import HomeAuthView from "./homeAuthView";
import { Eye, EyeClosed, X } from "lucide-react"
import ForgotPasswordView from "./forgotPasswordView";
import CreateUsernameView from "./CreateUsernameView";
import CreatePasswordView from "./CreatePasswordView";

interface AuthModalProps {
    onClose: any;
    isOpen: any;
    view?: "signup" | "login";
}

export interface AuthFormData {
    email: string,
    username: string,
    password: string,
    code: string,
}

type StepAuthView = "home_auth" | "forgot_password" | "create_password" | "create_username";


interface InputFieldProps {
    title: string,
    placeholder: string,
    type?: string,
    onChange: any,
    value: string,
    maxLength?: number | undefined,
    autoFocus?: boolean,
}


export const InputField = ({ title, placeholder, type = "text", onChange, value, maxLength = undefined , autoFocus = false}: InputFieldProps) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    return (
        <div className="w-full flex flex-col items-start gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <div className="flex items-center justify-between w-full border rounded-full border-[0.5px] border-[#565655] focus-within:ring-[1px] transition-all duration-200">
                <input autoFocus={autoFocus} value={value} placeholder={placeholder} type={type == "password" && showPassword ? "text" : type} maxLength={maxLength} className="w-full outline-none p-3 autofill:bg-transparent" onChange={onChange} />
                {type == "password" && <div onClick={() => setShowPassword(!showPassword)} className="mr-3">
                    {showPassword ? <Eye size={16} /> : <EyeClosed size={16} />}
                </div>}
            </div>
        </div>
    )
}

export const AuthModal = ({ onClose, isOpen }: AuthModalProps) => {
    const [currentAuthView, setCurrentAuthView] = useState<StepAuthView>("home_auth")
    const [authFormData, setAuthFormData] = useState<AuthFormData>({ email: "", username: "", password: "", code: "", })

    useEffect(() => {
        setCurrentAuthView("home_auth");
        setAuthFormData({ email: "", username: "", password: "", code: "", })
    }, [isOpen])
    return (
        <AnimatePresence>
            {isOpen && <CenterModalTemplate onClose={onClose} className={"w-full max-w-[550px] pt-4 pb-7 rounded-xl"} style={{ backgroundColor: "#222220" }} overlay="bg-black/75 backdrop-blur-sm">
                <div className="flex items-center justify-end px-4">
                    <div className="cursor-pointer flex items-center justify-center p-1.5 hover:bg-white/10 transition-colors duration-200 rounded-full" onClick={onClose}>
                        <X size={20} />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <div className="w-full max-w-[450px]">
                        {currentAuthView == "home_auth" && <HomeAuthView onNextStep={(step: StepAuthView) => setCurrentAuthView(step)} authFormData={authFormData} setAuthFormData={setAuthFormData} />}
                        {currentAuthView == "create_password" && <CreatePasswordView onNextStep={(step: StepAuthView) => setCurrentAuthView(step)} authFormData={authFormData} setAuthFormData={setAuthFormData} />}
                        {currentAuthView == "forgot_password" && <ForgotPasswordView onNextStep={(step: StepAuthView) => setCurrentAuthView(step)} authFormData={authFormData} setAuthFormData={setAuthFormData} />}
                        {currentAuthView == "create_username" && <CreateUsernameView onNextStep={(step: StepAuthView) => setCurrentAuthView(step)} authFormData={authFormData} setAuthFormData={setAuthFormData} />}
                    </div>
                </div>
            </CenterModalTemplate>
            }
        </AnimatePresence>
    )
}