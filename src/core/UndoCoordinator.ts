import { ObservableEvent } from "./ElgoraUI";

/** An already-applied action. A failed replay must leave the action's state unchanged. */
export interface UndoOperation {
    label?: string;
    undo(): void | Promise<void>;
    redo(): void | Promise<void>;
    /** Runs after replay commits its journal position; observer failures do not reverse replay. */
    afterReplay?(): void | Promise<void>;
}

/** Register async cleanup synchronously: `event.waitUntil(dataset.rejectChanges())`. */
export interface UndoBaselineEvent {
    waitUntil(completion: PromiseLike<void>): void;
}

/** One recording scope. Only its coordinator can execute or clear history. */
export interface UndoHistory {
    readonly name: string;
    readonly coordinator: UndoCoordinator;
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly changed: ObservableEvent<"record" | "undo" | "redo" | "clear">;
    readonly returnedToBaseline: ObservableEvent<UndoBaselineEvent>;
    /** Records an applied action, e.g. `scope.record({ undo, redo })`. */
    record(operation: UndoOperation): void;
}

interface Entry { history: UndoHistory; operation: UndoOperation; }

/**
 * One chronological journal for data, views, and other application actions.
 *
 * @example
 * const coordinator = new UndoCoordinator();
 * const data = coordinator.createHistory("data");
 * data.record({ undo: () => restoreOldValue(), redo: () => restoreNewValue() });
 * await coordinator.undo();
 * coordinator.clear(data); // after persistence; other scopes remain intact
 *
 * Replay is exclusive, including async baseline cleanup. A failed action keeps
 * the journal position unchanged. Observers run after committed actions; an
 * observer error does not undo that action. Event handlers must not mutate the
 * journal synchronously. Returning to baseline is per scope, not per journal.
 */
export class UndoCoordinator {
    private entries: Entry[] = [];
    private cursor = 0;
    private scopes = new Set<UndoHistory>();
    private locked = false;

    /** Emitted when journal state changes. Read `busy`, `canUndo` and `canRedo`. */
    readonly changed = new ObservableEvent<void>();

    /** True during replay or synchronous journal notifications. */
    get busy(): boolean { return this.locked; }
    /** Whether a global applied operation exists. */
    get canUndo(): boolean { return this.cursor > 0; }
    /** Whether a global undone operation exists. */
    get canRedo(): boolean { return this.cursor < this.entries.length; }

    /** Creates a separate baseline scope. Identical labels do not imply shared state. */
    createHistory(name: string): UndoHistory {
        this.ensureIdle();
        const coordinator = this;
        const history: UndoHistory = Object.freeze({
            name, coordinator,
            changed: new ObservableEvent<"record" | "undo" | "redo" | "clear">(),
            returnedToBaseline: new ObservableEvent<UndoBaselineEvent>(),
            get canUndo() { return coordinator.entries.slice(0, coordinator.cursor).some(e => e.history === history); },
            get canRedo() { return coordinator.entries.slice(coordinator.cursor).some(e => e.history === history); },
            record(operation: UndoOperation) { coordinator.record(history, operation); }
        });
        this.scopes.add(history);
        return history;
    }

    /** Establishes a new scope baseline after save/discard, removing its applied AND redo entries. */
    clear(history: UndoHistory): void {
        this.ensureIdle();
        this.ensureOwned(history);
        const applied = this.entries.slice(0, this.cursor).filter(e => e.history !== history);
        const undone = this.entries.slice(this.cursor).filter(e => e.history !== history);
        this.entries = [...applied, ...undone];
        this.cursor = applied.length;
        this.notify(history, "clear");
    }

    /** Undoes the last global action; e.g. `await coordinator.undo()`. */
    undo(): Promise<boolean> { return this.replay(false); }
    /** Redoes the next global action in chronological order. */
    redo(): Promise<boolean> { return this.replay(true); }

    /** Call before editing to reject changes during an async undo/redo. */
    ensureIdle(): void {
        if (this.busy) throw new Error("Undo history is busy.");
    }

    /** Records a defensive copy of the action and discards the entire global redo branch. */
    private record(history: UndoHistory, operation: UndoOperation): void {
        this.ensureIdle();
        this.ensureOwned(history);
        const owned = { label: operation.label, undo: operation.undo.bind(operation), redo: operation.redo.bind(operation), afterReplay: operation.afterReplay?.bind(operation) };
        this.entries.splice(this.cursor);
        this.entries.push({ history, operation: owned });
        this.cursor++;
        this.notify(history, "record");
    }

    /** Executes exclusively; baseline observers can register awaited completion work. */
    private async replay(redo: boolean): Promise<boolean> {
        this.ensureIdle();
        const entry = this.entries[redo ? this.cursor : this.cursor - 1];
        if (!entry) return false;
        this.locked = true;
        try {
            this.changed.invoke();
            await (redo ? entry.operation.redo() : entry.operation.undo());
            this.cursor += redo ? 1 : -1;
            const completions: PromiseLike<void>[] = [];
            try {
                try {
                    try {
                        await entry.operation.afterReplay?.();
                    } finally {
                        if (!redo && !entry.history.canUndo)
                            entry.history.returnedToBaseline.invoke({ waitUntil: completion => { completions.push(completion); } });
                    }
                } finally {
                    // Even if an observer throws, wait for already registered cleanup.
                    await Promise.all(completions);
                }
            } finally {
                // The action has committed even if its baseline observer failed.
                entry.history.changed.invoke(redo ? "redo" : "undo");
            }
            return true;
        } finally {
            this.locked = false;
            this.changed.invoke();
        }
    }

    /** Notifies after recording/clearing, protecting against reentrant journal mutations. */
    private notify(history: UndoHistory, kind: "record" | "clear"): void {
        this.locked = true;
        try { history.changed.invoke(kind); }
        finally { this.locked = false; this.changed.invoke(); }
    }

    /** Rejects operations on scopes owned by another coordinator. */
    private ensureOwned(history: UndoHistory): void {
        if (!this.scopes.has(history)) throw new Error("History belongs to another coordinator.");
    }
}
