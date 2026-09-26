import { AuthFormData } from "./authModal";

interface CreatePasswordViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const CreatePasswordView = ({ onNextStep, authFormData, setAuthFormData }: CreatePasswordViewProps) => {
    return (
        <div className="flex flex-col gap-6">
            <p className="text-3xl font-medium text-center">Forgot password</p>
        </div>
    )
}

export default CreatePasswordView;