import { DataFilter } from "../../data/filter";
import { OrderByToken } from "./DataColumn";
import { DataResult, DataSource } from "./DataSource";
import { GridRowsProvider } from "./GridRow";

/** Data access for self-referencing/parent-child hierarchical data (as opposed to groupBy-driven grouping). */
export interface TreeDataSource<TRow> {

    /** Loads a page of children for the given parent (null for root-level rows). */
    loadChildren(args: {
        parentKey: any | null;
        skip?: number;
        top?: number;
        filter?: DataFilter;
        orderBy?: OrderByToken[];
        signal?: AbortSignal;
    }): Promise<DataResult<TRow>>;

    /** Whether a row may have children, without necessarily having loaded them yet. */
    hasChildren(row: TRow): boolean | Promise<boolean>;
}

