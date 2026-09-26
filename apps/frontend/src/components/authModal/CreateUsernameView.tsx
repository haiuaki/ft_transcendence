import { useState } from "react";
import { AuthFormData, InputField } from "./authModal";
import {
    uniqueNamesGenerator,
    adjectives,
    animals,
} from "unique-names-generator";
import { Loader2 } from "lucide-react";

interface CreateUsernameViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const CreateUsernameView = ({ onNextStep, authFormData, setAuthFormData }: CreateUsernameViewProps) => {
    const [loading, setLoading] = useState<boolean>(false);

    const generateRandomUsername = () => {
        const adjectivesName = uniqueNamesGenerator({ dictionaries: [adjectives] });
        const animalsName = uniqueNamesGenerator({ dictionaries: [animals] });
        const randomNumber = Math.floor(Math.random() * 100)
        setAuthFormData({ ...authFormData, username: (adjectivesName.charAt(0).toUpperCase() + adjectivesName.slice(1)) + (animalsName.charAt(0).toUpperCase() + animalsName.slice(1)) + randomNumber })
    }
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <p className="text-3xl font-medium text-center">Create your username</p>
                <p className="text-sm text-center">Choose a username your friends will recognize.</p>
            </div>
            <InputField
                title="Username"
                placeholder="Enter an username"
                type="email"
                onChange={(e: any) => {
                    setAuthFormData({ ...authFormData, username: (e.target.value) })
                }}
                value={authFormData.username}
            />
            <div className="flex flex-col gap-4">
                <button className={`cursor-pointer w-full flex items-center gap-2 justify-center p-3 rounded-full bg-[#333332] hover:bg-[#40403e] active:bg-[#454545] transition-all duration-200 text-white font-medium`}
                    onClick={async () => generateRandomUsername()}>
                    <p>Generate username</p>
                </button>
                <button disabled={loading || authFormData.username.trim().length == 0} className={`cursor-pointer w-full flex items-center gap-2 justify-center p-3 rounded-full ${loading || authFormData.username.trim().length == 0 ? "bg-[#D0D0D0]" : "bg-[#ededed] hover:bg-[#D5D5D5] active:bg-[#D0D0D0]"} text-black font-medium`}
                    onClick={async () => {
                        onNextStep("create_password")
                    }}>
                    {loading ? <Loader2 className="animate-spin" /> : null}
                    <p> {loading ? "Continuing..." : "Continue"}</p>
                </button>
            </div>
        </div>
    )
}

export default CreateUsernameView;