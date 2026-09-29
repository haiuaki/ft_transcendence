import { useState } from "react";
import { AuthFormData, ButtonAuth, InputField, SetAuthFormData, StepAuthView } from "./AuthModal";
import {
    uniqueNamesGenerator,
    adjectives,
    animals,
} from "unique-names-generator";

import { Info } from "lucide-react";
import { themeColors } from "@/src/lib/themeColors";

interface CreateUsernameViewProps {
    onNextStep: (view: StepAuthView) => void;
    authFormData: AuthFormData;
    setAuthFormData: SetAuthFormData;
}

const MAX_LENGTH = 20

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const CreateUsernameView = ({ onNextStep, authFormData, setAuthFormData }: CreateUsernameViewProps) => {
    const [error, setError] = useState<"bad_length" | "bad_characters" | null>(null);
    const colors = themeColors;
    const generateRandomUsername = () => {
        const adjectivesName = uniqueNamesGenerator({ dictionaries: [adjectives] });
        const animalsName = uniqueNamesGenerator({ dictionaries: [animals] });
        const randomNumber = crypto.getRandomValues(new Uint32Array(1))[0] % 100;
          const username = adjectivesName.charAt(0).toUpperCase() + adjectivesName.slice(1) + (animalsName.charAt(0).toUpperCase() + animalsName.slice(1)) + randomNumber
        if (username.length > 20)
            generateRandomUsername();
        else
            setAuthFormData({ ...authFormData, username: username })
    }
    return (
        <div className="flex min-h-0 h-full flex-col ">
            <div className="flex-1 flex flex-col gap-6 text-black">
                <p className="text-3xl font-semibold text-center">Create your username</p>
                <div className="flex flex-col gap-2">
                    <InputField
                        placeholder="Enter an username"
                        type="text"
                        maxLength={MAX_LENGTH}
                        onChange={(e) => {
                            setError(null);
                            setAuthFormData({ ...authFormData, username: (e.target.value) })
                        }}
                        value={authFormData.username}
                        error={error == "bad_characters" || error == "bad_length"}
                    />
                    <div className="flex items-center justify-between">
                        {(error == "bad_length" || error == "bad_characters") ? <div className="flex items-center gap-2">
                            <Info size={14} color="red" />
                            <p className="text-red-500 text-sm font-semibold">{error == "bad_characters" ? "Invalid characters.": "Must be 3–20 characters."}</p>
                            </div>
                            : <p />
                        }
                        <div className={`${colors.textSecondary} font-semibold text-sm`}>{authFormData.username.length}/20</div>
                    </div>
                </div>
                </div>
                <div className="flex flex-col gap-2">
                    <ButtonAuth
                        disabled={authFormData.username.trim().length == 0}
                        isLoading={false}
                        textAction="Continuing..."
                        text="Continue"
                        onPress={async () => {
                            if (authFormData.username.length > 20) return setError("bad_length")
                            if (!usernameRegex.test(authFormData.username)) return setError("bad_characters")
                            onNextStep("create_password")
                        }}
                    />
                    <p className={`select-none text-sm ${colors.textSecondary} font-semibold text-center`}>No username in mind? <span onClick={generateRandomUsername} className="text-black cursor-pointer">Generate one</span></p>
                </div>
            </div>
            )
}

            export default CreateUsernameView;