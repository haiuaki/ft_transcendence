// Where the AI assistant keeps its conversation in the browser
export const AI_HISTORY_KEY = "kewan_ai_history";
export const AI_DRAFT_KEY = "kewan_ai_draft";

export const getAiHistoryKey = (userId?: string | null) => {
    return userId ? `${AI_HISTORY_KEY}_${userId}` : AI_HISTORY_KEY;
};

export const getAiDraftKey = (userId?: string | null) => {
    return userId ? `${AI_DRAFT_KEY}_${userId}` : AI_DRAFT_KEY;
};

// Forget the conversation, so the next person on this browser doesn't see it
export const clearAiHistory = (userId?: string | null) => {
    try {
        localStorage.removeItem(getAiHistoryKey(userId));
        sessionStorage.removeItem(getAiDraftKey(userId));
        // Clear default keys as fallback
        localStorage.removeItem(AI_HISTORY_KEY);
        sessionStorage.removeItem(AI_DRAFT_KEY);
    } catch {
        // Storage can be unavailable (private mode, blocked site data)
    }
}
