/**
 * ============================================================================
 *  PIPELINE BOARD CONFIGURATION
 * ============================================================================
 *  Copy, flags and behaviour for /admin/pipeline. The stages themselves are
 *  NOT here — they come from config/pipeline.ts, which is the single source of
 *  truth for the funnel.
 *
 *  Quick answers to the usual requests:
 *    - Turn off the funnel view ....... features.funnelView = false
 *    - Turn off drag and drop ......... features.dragAndDrop = false
 *    - Change when a card goes amber .. staleAfterDays (config/clients.ts)
 *    - Reword the drag announcements .. content.announce
 * ============================================================================
 */
export const boardConfig = {
    features: {
        dragAndDrop: true,
        funnelView: true,
        staleMarkers: true,
        dropPreview: true,
        undoMove: true,
        separateLostColumn: true,
    },
    defaultView: "kanban",
    content: {
        kanbanLabel: "Kanban",
        funnelLabel: "Funnel",
        viewSwitchLabel: "Board view",
        emptyColumn: "No leads",
        emptyBoardTitle: "No leads yet",
        emptyBoardDescription: "Leads appear here as they come in. Add one from the Clients screen.",
        dragHandleLabel: "Drag {name} to another stage",
        dropHerePreview: "Drop {name} here",
        movedToast: "{name} moved to {stage}",
        undoToast: "{name} moved back to {stage}",
        moveFailedToast: "Could not move {name}",
        staleLabel: "Not moved in {days} days",
        funnelTitle: "Conversion Funnel",
        funnelHint: "Reach and drop-off by stage",
        funnelDropOffLabel: "drop-off",
        funnelReachedLabel: "reached this stage or beyond",
        lostGroupLabel: "Closed lost",
        // These are read aloud during a keyboard drag, so they have to describe the
        // board in words — a sighted user sees the card lift and the column
        // highlight, and this is the equivalent.
        announce: {
            start: "Picked up {name} from {stage}.",
            over: "{name} is over {stage}.",
            end: "{name} dropped into {stage}.",
            cancel: "Move cancelled. {name} returned to {stage}.",
        },
    },
};
