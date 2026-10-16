/** User-facing strings rendered by DataGrid. Override via DataGridOptions.texts to localize or customize wording. */
export interface DataGridTexts {
    /** Label for the untouched input row at the end of an editable grid. */
    newRowText: string;
    /** Shown in the group panel when no columns are grouped. */
    groupPanelEmptyText: string;
}

/** Default values for DataGridTexts, used for any text not overridden in DataGridOptions.texts. */
export const DEFAULT_GRID_TEXTS: DataGridTexts = {
    newRowText: "New row",
    groupPanelEmptyText: "Drag a column here to group"
};
