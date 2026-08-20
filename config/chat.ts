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

export interface ChatFeatureFlags {
  /**
   * Enter sends, Shift+Enter inserts a newline.
   *
   * The right default for a chat composer — a message is usually one line, and
   * reaching for a Send button on every one is the slowest possible path. Set
   * false to make Enter always insert a newline.
   */
  enterSends: boolean;
  /** Scroll the pane to the newest message on send and on thread change. */
  autoScroll: boolean;
  /** Drop deactivated reps from the conversation list. */
  hideInactiveReps: boolean;
}

export interface ChatConfig {
  features: ChatFeatureFlags;
  content: {
    listTitle: string;
    listHint: string;
    searchPlaceholder: string;
    noPreview: string;
    emptyThreadTitle: string;
    emptyThreadDescription: string;
    noSelectionTitle: string;
    noSelectionDescription: string;
    noRepsTitle: string;
    noRepsDescription: string;
    /** Accessible name for the message log region. */
    messageLogLabel: string;
    composerPlaceholder: string;
    sendLabel: string;
    sendHint: string;
    backLabel: string;
    /** Appended after a rep's title when their account is deactivated. */
    inactiveSuffix: string;
    /** The honesty notice under the composer. */
    notLiveNotice: string;
  };
}

export const chatConfig: ChatConfig = {
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
    messageLogLabel: "Messages",
    composerPlaceholder: "Write a message…",
    sendLabel: "Send",
    sendHint: "Enter to send · Shift+Enter for a new line",
    backLabel: "Conversations",
    inactiveSuffix: "Inactive",

    // This is a mock. Saying so on the screen matters more here than anywhere
    // else in the console: a chat panel that looks live but silently delivers
    // nothing is how a rep misses a message they believed was sent.
    notLiveNotice:
      "Messages are stored in your browser only — this demo has no live delivery.",
  },
};
