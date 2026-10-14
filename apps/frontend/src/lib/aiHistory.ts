// Where the AI assistant keeps its conversation in the browser
export const AI_HISTORY_KEY = "kewan_ai_history";
export const AI_DRAFT_KEY = "kewan_ai_draft";

// Forget the conversation, so the next person on this browser doesn't see it
export const clearAiHistory = () => {
    try {
        localStorage.removeItem(AI_HISTORY_KEY);
        sessionStorage.removeItem(AI_DRAFT_KEY);
    } catch {
        // Storage can be unavailable (private mode, blocked site data)
    }
}
