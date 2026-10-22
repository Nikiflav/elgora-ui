/** Shared behavior for value editors with a picker popover. */
export interface PopoverEditorOptions {
    /**
     * Opens the picker when the input receives focus. Date editors focus DatePicker,
     * TimeEditor focuses its time list, and LookupEditor retains search input focus.
     * Returning from a picker choice or Escape does not reopen the panel.
     * Defaults to false. Explicit button/keyboard opening remains available.
     * @example new DateEditor({ value: null, openOnFocus: true });
     */
    openOnFocus?: boolean;
}
