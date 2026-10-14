/** Shared behavior for value editors with a picker popover. */
export interface PopoverEditorOptions {
    /**
     * Opens the picker when the input receives focus. DateEditor focuses Calendar;
     * LookupEditor keeps focus in its search input.
     * Defaults to false. Explicit button/keyboard opening remains available.
     * @example new DateEditor({ value: null, openOnFocus: true });
     */
    openOnFocus?: boolean;
}
