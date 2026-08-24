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

export type BoardView = "kanban" | "funnel";

export interface BoardFeatureFlags {
  dragAndDrop: boolean;
  /** The Kanban / Funnel segmented control and the funnel itself. */
  funnelView: boolean;
  /** Amber age marker on cards that have not moved. */
  staleMarkers: boolean;
  /**
   * Drop preview: the target column lights up and shows a labelled landing
   * slot while a card is held over it.
   *
   * Without this a drag is a guess — the card follows the cursor but nothing
   * says which column will receive it, so you find out by letting go. Turn off
   * only if the highlight proves distracting; the column highlight and the
   * landing slot are one flag because half of the affordance is worse than
   * neither.
   */
  dropPreview: boolean;
  /** Undo action on the toast after a drop. */
  undoMove: boolean;
  /**
   * Splits terminal-loss stages out of the main column run.
   *
   * "Lost" is not a step forward, and in the prototype it sat inline as a
   * seventh equal column — which reads as the stage after "Client". Separating
   * and dimming it makes the column order say what the funnel actually does.
   */
  separateLostColumn: boolean;
}

export interface BoardConfig {
  features: BoardFeatureFlags;
  defaultView: BoardView;
  content: {
    kanbanLabel: string;
    funnelLabel: string;
    viewSwitchLabel: string;
    emptyColumn: string;
    emptyBoardTitle: string;
    emptyBoardDescription: string;
    dragHandleLabel: string;
    /** Text in the landing slot during a drag. `{name}` is replaced. */
    dropHerePreview: string;
    /** `{name}` and `{stage}` are replaced. */
    movedToast: string;
    undoToast: string;
    moveFailedToast: string;
    staleLabel: string;
    funnelTitle: string;
    funnelHint: string;
    funnelDropOffLabel: string;
    funnelReachedLabel: string;
    lostGroupLabel: string;
    /** Screen-reader announcements for the drag lifecycle. */
    announce: {
      start: string;
      over: string;
      end: string;
      cancel: string;
    };
  };
}

export const boardConfig: BoardConfig = {
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
    emptyBoardDescription:
      "Leads appear here as they come in. Add one from the Clients screen.",
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
