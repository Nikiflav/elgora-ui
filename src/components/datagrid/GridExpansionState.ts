/**
 * Independent snapshot of group expansion for one source and grouping definition.
 * Contains no rows or cached query results. Treat keys as opaque identifiers; reuse
 * only with the same source and ordered grouping fields/intervals. Tree mode is not included.
 * @example
 * const state = grid.getExpansionState();
 * await grid.setExpansionState(state);
 */
export interface GridExpansionState {
    /** Expanded group keys, including descendants retained beneath collapsed parents.
     * An empty list means all groups are collapsed; missing groups are ignored on restore. */
    readonly expandedGroupKeys: readonly string[];
}

/** @internal Copies and validates a caller-owned snapshot before asynchronous restoration. */
export function copyExpansionState(state: GridExpansionState): GridExpansionState {
    if (!state || !Array.isArray(state.expandedGroupKeys) || state.expandedGroupKeys.some(key => typeof key !== "string"))
        throw new Error("Failed to restore group expansion. expandedGroupKeys must be an array of strings.");
    return { expandedGroupKeys: [...new Set(state.expandedGroupKeys)] };
}
