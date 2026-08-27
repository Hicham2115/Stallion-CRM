/**
 * ============================================================================
 *  TEAM CHAT CONFIGURATION
 * ============================================================================
 *  Copy and flags for /admin/chat.
 *
 *  Quick answers to the usual requests:
 *    - Reword anything ................ `content`
 *    - Hide inactive reps ............. features.hideInactiveReps = true
 *    - Change the Enter behaviour ..... features.enterSends
 * ============================================================================
 */
export const chatConfig = {
    features: {
        enterSends: true,
        autoScroll: true,
        hideInactiveReps: false,
    },
    content: {
        listTitle: "Conversations",
        listHint: "One thread per rep",
        searchPlaceholder: "Search reps…",
        noPreview: "No messages yet",
        emptyThreadTitle: "No messages yet",
        emptyThreadDescription: "Send the first message to start this conversation.",
        noSelectionTitle: "Pick a conversation",
        noSelectionDescription: "Choose a rep from the list to see your messages.",
        noRepsTitle: "No reps yet",
        noRepsDescription: "Add a rep from Settings to start messaging.",
        selfLabel: "You",
        messageLogLabel: "Messages",
        composerPlaceholder: "Write a message…",
        sendLabel: "Send",
        sendHint: "Enter to send · Shift+Enter for a new line",
        backLabel: "Conversations",
        inactiveSuffix: "Inactive",
        // This is a mock. Saying so on the screen matters more here than anywhere
        // else in the console: a chat panel that looks live but silently delivers
        // nothing is how a rep misses a message they believed was sent.
        notLiveNotice: "Messages are stored in your browser only — this demo has no live delivery.",
    },
};
