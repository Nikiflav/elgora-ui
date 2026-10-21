import type { DataFilter } from "./filter";
import type { OrderByToken, GroupInterval } from "./grouping";
import type { SummaryRequest, SummaryResult, SummaryType } from "./summary";
import type { RowIdentity } from "./RowIdentity";
import type { Observable } from "../core/ElgoraUI";
import type { UndoCoordinator } from "../core/UndoCoordinator";

/** One grouping level in a loadData query, from outermost to innermost. */
export interface GroupByField {
    /** Field identifier to group, interpreted by the source's field accessors. */
    field: string;
    /** Named grouping interval; omit to group raw values. */
    interval?: GroupInterval;
}

/** A single page/query request made against a DataSource. */
export interface QueryArgs {
    /** Conditions applied before sorting, grouping, paging and aggregation. Omit for all rows. */
    filter?: DataFilter;
    /** Ordered sort keys; a bare field name means ascending order. Omit for source order. */
    orderby?: OrderByToken[];
    /** Field names to include; omit to fetch all fields. */
    select?: string[];
    /** Number of matching rows or outer groups to skip; zero-based, default 0. */
    skip?: number;
    /** Maximum rows or outer groups to return after skip. Omit to return the remaining result. */
    top?: number;
    /**
     * Requested grouping levels. A nonempty list returns groups, not dataItems.
     * Multiple levels return complete nested groups; skip/top page only the outermost
     * groups. Leaf data rows are never included. Omit or use [] for a flat query.
     */
    groupBy?: GroupByField[];
    /** Aggregations to compute per group, per field. */
    groupSummary?: {
        /** Field whose values are aggregated within each bucket. */
        field: string;
        /** Built-in aggregation or registered custom summary name. */
        summaryType: SummaryType;
    }[];
    /**
     * Optional, demand-driven aggregations for the complete filtered result,
     * independently of paging and grouping. When omitted, the datasource
     * should not calculate or return total summaries.
     */
    totalSummary?: SummaryRequest[];
    /** Value to match against the data source's parent-reference field; present only in hierarchical (parent/child) mode. */
    parentId?: any;
    /** Whether the caller needs an accurate total row/group count back. */
    requireTotalCount?: boolean;
    /**
     * Cancellation signal for this query. The grid aborts its owned queries when
     * the row view is replaced or disposed.
     * Remote implementations should pass it to fetch() or equivalent transport.
     * Shared page requests may outlive an individual viewport waiter.
     */
    abortSignal?: AbortSignal;
}

/** A group bucket produced by QueryArgs.groupBy; count is the number of matching data rows. */
export type GroupItem = {
    /** Field identifier from the corresponding groupBy descriptor. */
    groupField: string;
    /**
     * Group value, without dataType-based conversion. null/undefined share null;
     * empty text ("") is a separate group and must not be merged with null.
     * other values retain their type. Sources supply one consistent value type per
     * grouped field. Intervals return bucket values (e.g. month -> 2), not the
     * original date. Remote sources return null for missing values and calculate
     * counts/summaries per distinct group before paging.
     */
    groupValue: any;
    /** Matching data-row count in this bucket, including all nested groups, before paging. */
    count: number;
    /** Aggregated values, keyed by field name, per QueryArgs.groupSummary. */
    summaryValues?: Record<string, any>;
    /** Complete children for the next requested groupBy level; omitted at the last level. */
    groups?: GroupItem[];
};

/** The response to a QueryArgs request: either flat data rows or, when grouping, group buckets. */
export interface DataResult<TRow> {
    /** Matching row count, or outer-group count, before paging. Required when requireTotalCount is true. */
    totalCount?: number;
    /** Query that produced this response, retained so consumers can correlate requests and results. */
    args: QueryArgs;
    /** Requested page of original row objects for flat queries; omitted for grouped queries. */
    dataItems?: TRow[];
    /** Used exclusively for a nonempty args.groupBy. totalCount counts outermost groups before paging. */
    groups?: GroupItem[];
    /**
     * Aggregations for the complete filtered result, before paging and
     * grouping. Returned only when `args.totalSummary` was requested; values
     * must not be calculated from the returned page alone.
     */
    totalSummary?: SummaryResult[];
}

/** Result of a row mutation. Expected validation failures resolve; transport failures reject. */
export type MutationResult = {
    /** The mutation completed successfully. Persistence depends on the source implementation. */
    success: true;
} | {
    /** The mutation was rejected; inspect error and optional fieldErrors. */
    success: false;
    /** User-facing explanation of why the mutation was rejected. */
    error: string;
    /** Optional field-specific validation messages, e.g. { quantity: "Must be positive" }. */
    fieldErrors?: Record<string, string>;
};

/**
 * A new-row editing session owned by its source.
 * The application retains this handle and explicitly chooses insert() or cancel().
 * For DataTable, pending sessions block saveChanges(), acceptChanges() and rejectChanges().
 * @example
 * const newRowSession = await source.createNewRow!();
 * await source.update!(newRowSession.row, { quantity: 3 });
 * const result = await newRowSession.insert();
 * if (!result.success) showError(result.error);
 */
export interface NewRowSession<TRow> {
    /** Actual source row being edited; update it through the source before inserting. */
    readonly row: TRow;
    /** Session lifecycle. Only pending rows can be inserted or cancelled for the first time. */
    readonly state: "pending" | "inserted" | "cancelled";
    /**
     * Confirms insertion. A rejected result leaves the session pending for correction.
     * For DataTable this is local; remote sources may persist here. Repeated insert
     * after success is harmless. Insert after cancellation must reject.
     */
    insert(): Promise<MutationResult>;
    /** Discards this pending session. Repeated cancel is harmless; cancel after insert rejects. */
    cancel(): Promise<void>;
}

/**
 * Working data changed, not necessarily persisted data. Pending rows notify too.
 * `row` is the actual source object; absent row means a broader invalidation.
 * Sources supporting this event must notify for successful mutations and replay.
 * Components may repaint pending values without reloading/reordering the dataset.
 */
export interface DataSourceChanged<TRow> {
    /**
     * The completed working-data operation. For DataTable, emitted only after transaction success.
     * create initializes a pending draft outside table queries; insert includes that draft locally
     * into the table (not to a server). update changes field values, including pending values.
     * delete removes/marks a confirmed row; cancel discards a pending draft.
     * reset requests a broader repaint after undo/redo, import, acceptance or rejection.
     */
    kind: "create" | "update" | "insert" | "delete" | "cancel" | "reset";
    /** Actual affected row, including pending drafts. Omitted for source-wide invalidation. */
    row?: TRow;
    /** Changed field names when known; omission means consumers must not assume a field-level change. */
    fields?: readonly string[];
}

/** Query and optional row-edit access, independent of DataTable or a remote implementation. */
export interface DataSource<TRow> {
    /**
     * Loads a page of rows or grouped records.
     *
     * When `args.groupBy` is omitted or empty, the datasource should return
     * `dataItems` containing the requested page of rows. When grouping is
     * requested and the datasource supports it, it should return `groups`,
     * where each group contains its key, row count, and any requested
     * `groupSummary` values. A supported grouped query may legitimately
     * return `groups: []` when no rows match the query; callers must not
     * interpret that as a request to perform grouping locally.
     * More than one groupBy descriptor requests a nested tree. Every non-leaf
     * group must include its complete groups array for the next descriptor;
     * count remains the number of data rows in that bucket. No leaf data rows
     * are returned. skip/top affect only the outer group array, and totalCount
     * counts outer groups. With no top, all outer groups must be returned.
     *
     * For a grouped request that the datasource does not handle, it should
     * return a result with both `dataItems` and `groups` undefined.
     * `LocalGroupingDataSource` uses that response as the signal to issue a
     * second flat request, then performs grouping and supported summaries
     * locally. The server should not return a partial flat page for the
     * grouped request because the local datasource will make that flat
     * request itself.
     *
     * `skip` and `top` apply to the returned rows or groups. `totalCount`,
     * when requested, must describe the complete result before pagination.
     * When `args.totalSummary` is present, the datasource must return a
     * matching `totalSummary` for the complete filtered result, before
     * pagination and grouping. The request is optional so remote sources can
     * avoid an expensive aggregate query when the grid does not need the
     * footer values; when it is absent, `totalSummary` should be omitted.
     * Implementations should preserve `args` in the returned `DataResult` so
     * consumers can associate a response with the query that produced it.
     *
     * @param args Query, filtering, grouping, pagination, and summary options.
     * @returns The loaded rows or groups, optional total count, and any
     * requested total summaries.
     */
    loadData(args: QueryArgs): Promise<DataResult<TRow>>;

    /** Optional notifications; consumers dispose their subscription, never the source's event. */
    readonly changed?: Observable<DataSourceChanged<TRow>>;
    /**
     * Reports whether a field differs from the last accepted/persisted baseline.
     * Optional, synchronous and side-effect-free; omit when modification tracking is unavailable.
     * Notify through changed after edits, undo/redo, or accepting a successful save so views repaint.
     * Newly inserted, unsaved rows may report all present fields as modified.
     */
    isCellModified?(row: TRow, fieldName: string): boolean;
    /** Optional shared history. Execute undo/redo only through this coordinator. */
    readonly undoCoordinator?: UndoCoordinator;
    /**
     * Creates an independently owned new-row session; multiple sessions may coexist.
     * The row has a stable temporary identity and is excluded from normal queries
     * until insert. Pending edits may read other rows but must not mutate them.
     * Example: const newRowSession = await source.createNewRow?.();
     */
    createNewRow?(): Promise<NewRowSession<TRow>>;
    /**
     * Applies values to the actual source row, including a pending session row.
     * Each successful command and its business effects form one transaction if
     * the source supports history. Example: await source.update?.(row, { price: 20 }).
     */
    update?(row: TRow, values: Record<string, unknown>): Promise<MutationResult>;
    /** Deletes a confirmed row. Use the pending session's cancel() for an unconfirmed row. */
    delete?(row: TRow): Promise<MutationResult>;

    /** Returns a stable identity for a row, used as its render key and, in hierarchical mode, as the parentId for its children. */
    getRowId?(row: TRow): RowIdentity;

    /** Presence marks this source as hierarchical (parent/child) and disables groupColumns; answers per-row expandability. */
    hasChildren?(row: TRow): Promise<boolean>;
}
