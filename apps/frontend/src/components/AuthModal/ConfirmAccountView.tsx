import { AuthFormData } from "./AuthModal";

interface ConfirmAccountViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const ConfirmAccountView = ({ onNextStep, authFormData, setAuthFormData }: ConfirmAccountViewProps) => {
    return (
        <div className="flex flex-col h-full min-h-0 text-black">
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <p className="text-3xl font-semibold text-center">Confirmer votre Compte</p>
                    <p>Nous avons envoyé un lien a {authFormData.email}</p>
                </div>
            </div>
        </div>
    )
}

export default ConfirmAccountView;