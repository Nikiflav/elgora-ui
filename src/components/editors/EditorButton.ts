/** Picker trigger presentation shared by field hosts and popover editors. */
export interface EditorButton {
    /** CSS icon class displayed inside the trigger. */
    icon: string;
    /** Accessible name and tooltip for the trigger. */
    label: string;
}

/** Built-in trigger descriptions; sharing them avoids creating editors just to render a cell button. */
export const editorButtons = {
    lookup: { icon: "ri-arrow-down-s-line", label: "Open lookup" },
    date: { icon: "ri-calendar-line", label: "Open date picker" },
    time: { icon: "ri-time-line", label: "Open time picker" },
    datetime: { icon: "ri-calendar-line", label: "Open date and time picker" }
} satisfies Record<string, EditorButton>;
