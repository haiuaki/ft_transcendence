const URL = "/api"

export interface TwoFactorSetupResponse {
    secret: string
    otpauth_url: string
    qr_code: string
}

const twoFactorService = {
    setup: async (token: string): Promise<TwoFactorSetupResponse> => {
        if (!token.trim())
            throw new Error("Token is required");
        const response = await fetch(URL + "/2fa/setup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        })
        if (!response.ok)
            throw new Error(await response.text() || "Failed to start 2FA setup")
        return (await response.json());
    },
    enable: async (token: string, code: string) => {
        if (!token.trim())
            throw new Error("Token is required");
        if (!code.trim())
            throw new Error("Code is required");
        const response = await fetch(URL + "/2fa/enable", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ code: code.trim() })
        })
        if (!response.ok)
            throw new Error(await response.text() || "Failed to enable 2FA")
        return (await response.json());
    },
    disable: async (token: string, code: string) => {
        if (!token.trim())
            throw new Error("Token is required");
        if (!code.trim())
            throw new Error("Code is required");
        const response = await fetch(URL + "/2fa/disable", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ code: code.trim() })
        })
        if (!response.ok)
            throw new Error(await response.text() || "Failed to disable 2FA")
        return (await response.json());
    },
    verify: async (tempToken: string, code: string): Promise<{ token: string }> => {
        if (!tempToken.trim())
            throw new Error("Temp token is required");
        if (!code.trim())
            throw new Error("Code is required");
        const response = await fetch(URL + "/2fa/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                temp_token: tempToken,
                code: code.trim()
            })
        })
        if (!response.ok)
            throw new Error(await response.text() || "Invalid 2FA code")
        return (await response.json());
    }
}

export default twoFactorService;