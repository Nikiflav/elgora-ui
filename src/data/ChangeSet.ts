import type { RowIdentity } from "./RowIdentity";

/** A transport change containing field values, never a domain row object. */
export interface DataChange {
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
    temporaryKey: RowIdentity;
    key: RowIdentity;
}

/** Result returned after a data source processes a batch of edits. */
export type SaveChangesResult =
    | {
        success: true;
        /** Present when the server replaced one or more temporary insert keys. */
        keyMappings?: KeyMapping[];
    }
    | {
        success: false;
        /** A user-facing or application-level explanation of the rejected batch. */
        error: string;
    };
