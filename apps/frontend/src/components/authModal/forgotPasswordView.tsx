import { AuthFormData, InputField } from "./authModal";

interface HomeAuthViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const ForgotPasswordView = ({ onNextStep, authFormData, setAuthFormData }: HomeAuthViewProps) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
            <p className="text-3xl font-medium text-center">Forgot password</p>
            <p className="text-sm text-center">Enter your email and we’ll send you a link to reset your password.</p>
            </div>
                <InputField
                    title="Email"
                    placeholder="Enter an email"
                    type="email"
                    onChange={(e: any) => {
                        setAuthFormData({ ...authFormData, email: (e.target.value) })
                    }}
                    value={authFormData.email}
                />
            
        </div>
    )
}

export default ForgotPasswordView;