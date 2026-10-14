// Input rules shared by the forms. The backend enforces the same ones,
// so keep both sides in sync when changing a rule.

// Same as UsernameRegex in apps/backend/src/services/auth/username.go
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
export const USERNAME_RULE = "Username must be 3-30 characters and contain only letters, numbers, and underscores.";

// Loose check, the backend does the strict parsing
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

// bcrypt only uses the first 72 bytes of a password
const MAX_PASSWORD_BYTES = 72;
export const byteLength = (text: string) => new TextEncoder().encode(text).length;

// Same rules as PasswordProblem in apps/backend/src/services/auth/password.go
export const passwordRules = (password: string) => [
    { isValid: [...password].length >= 10, text: "10 characters minimum" },
    { isValid: byteLength(password) <= MAX_PASSWORD_BYTES, text: "72 characters maximum" },
    { isValid: /[^a-zA-Z0-9]/.test(password), text: "1 special character" },
    { isValid: /[0-9]/.test(password), text: "1 number" },
    { isValid: password.trim().length > 0 && password.length == password.trim().length, text: "No leading or trailing whitespace" },
];

// Same limits as CreateRoom/UpdateRoom in apps/backend/src/services/chat/rooms.go
export const roomNameProblem = (name: string) => {
    const length = [...name.trim()].length;
    if (length === 0) return "A name is required for a room.";
    if (length < 3 || length > 30) return "Room name must be between 3 and 30 characters.";
    return null;
}

export const roomPasswordProblem = (password: string) => {
    if (!password.trim()) return "A password is required for a private room.";
    if (byteLength(password) > MAX_PASSWORD_BYTES) return "Room password must be at most 72 characters long.";
    return null;
}
