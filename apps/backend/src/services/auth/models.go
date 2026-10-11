package auth

type Credentials struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// What the frontend sends to enable or disable 2FA
type TwoFactorCodeRequest struct {
	Code string `json:"code"`
}

// What the frontend sends to finish a login when 2FA is enabled
type TwoFactorVerifyRequest struct {
	TempToken string `json:"temp_token"`
	Code      string `json:"code"`
}

// What we send back when starting 2FA setup
type TwoFactorSetupResponse struct {
	Secret     string `json:"secret"`
	OTPAuthURL string `json:"otpauth_url"`
	QRCode     string `json:"qr_code"`
}
