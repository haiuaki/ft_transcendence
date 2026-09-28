import { useState } from "react";
import { AuthFormData, ButtonAuth, InputField } from "./authModal";
import {
    uniqueNamesGenerator,
    adjectives,
    animals,
} from "unique-names-generator";
import { Loader2 } from "lucide-react";
import { error } from "console";

interface CreateUsernameViewProps {
    onNextStep: any;
    authFormData: AuthFormData;
    setAuthFormData: any;
}


const CreateUsernameView = ({ onNextStep, authFormData, setAuthFormData }: CreateUsernameViewProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const generateRandomUsername = () => {
        const adjectivesName = uniqueNamesGenerator({ dictionaries: [adjectives] });
        const animalsName = uniqueNamesGenerator({ dictionaries: [animals] });
        const randomNumber = Math.floor(Math.random() * 100)
        setAuthFormData({ ...authFormData, username: (adjectivesName.charAt(0).toUpperCase() + adjectivesName.slice(1)) + (animalsName.charAt(0).toUpperCase() + animalsName.slice(1)) + randomNumber })
    }
    return (
        <div className="flex min-h-0 h-full flex-col ">
            <div className="flex-1 flex flex-col gap-6 text-black">
                <p className="text-3xl font-semibold text-center">Create your username</p>
                <div className="flex flex-col gap-2">

                    <InputField
                        placeholder="Enter an username"
                        type="text"
                        onChange={(e: any) => {
                            setAuthFormData({ ...authFormData, username: (e.target.value) })
                        }}
                        value={authFormData.username}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <ButtonAuth
                    disabled={isLoading || authFormData.username.trim().length == 0}
                    isLoading={isLoading}
                    textAction="Continuing..."
                    text="Continue"
                    onPress={async () => {
                        onNextStep("create_password")
                    }}
                />
                <p className="select-none text-sm text-black/60 font-semibold text-center">No username in mind? <span onClick={generateRandomUsername} className="text-black cursor-pointer">Generate one</span></p>
            </div>
        </div>
    )
}

export default CreateUsernameView;