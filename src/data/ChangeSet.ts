import type { RowIdentity } from "./RowIdentity";

/** A transport change containing field values, never a domain row object. */
export interface DataChange {
    /** Transport operation: insert a row, update its fields, or remove it by key. */
    type: "insert" | "update" | "remove";
    /** Insert may omit this when its data already contains the identity field. */
    key?: RowIdentity;
    /** All insert values, or changed update fields; absent for removal. */
    data?: Record<string, unknown>;
}

/** Changes for one table/source, submitted together. Keys always use RowIdentity. */
export type ChangeSet = DataChange[];

/** Maps a client-side temporary key to the key assigned by the server. */
export interface KeyMapping {
    /** Identity used by the client before persistence. */
    temporaryKey: RowIdentity;
    /** Persisted identity assigned to the same row by the server. */
    key: RowIdentity;
}

/** Result returned after a data source processes a batch of edits. */
export type SaveChangesResult =
    | {
        /** The entire submitted batch was saved successfully. */
        success: true;
        /** Present when the server replaced one or more temporary insert keys. */
        keyMappings?: KeyMapping[];
    }
    | {
        /** The batch was rejected; pending changes remain available for correction. */
        success: false;
        /** A user-facing or application-level explanation of the rejected batch. */
        error: string;
    };
