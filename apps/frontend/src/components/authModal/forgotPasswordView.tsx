import { AuthFormData } from "./authModal";

interface HomeAuthViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const ForgotPasswordView = ({ onNextStep, authFormData, setAuthFormData }: HomeAuthViewProps) => {
    return (
        <div className="flex flex-col gap-6">
            <p className="text-3xl font-medium text-center">Forgot password</p>
        </div>
    )
}

export default ForgotPasswordView;