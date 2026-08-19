/** Measures virtual-list rows and maps between indexes and scroll offsets. */
export interface SizeManager {
    get defaultSize(): number;
    set defaultSize(value: number);
    getSize(index: number): number;
    update(index: number, newSize: number): void;
    getOffset(index: number): number;
    findIndex(offset: number): number;
}

/** Size manager for lists whose rows share one fixed height. */
export class FixedSizeManager implements SizeManager {
    private _defaultSize: number;
    constructor(defaultSize: number) {
        this._defaultSize = defaultSize ?? 30;
    }

    get defaultSize(): number {
        return this._defaultSize;
    }

    set defaultSize(value: number) {
        this._defaultSize = value;
    }

    getSize(index: number): number {
        return this._defaultSize;
    }
    update(index: number, newSize: number): void {
        // since all items have the same size
        this._defaultSize = newSize;
    }
    findIndex(offset: number): number {
        return Math.floor(offset / this._defaultSize);
    }
    getOffset(index: number): number {
        return index * this._defaultSize;
    }
}


/**
 * Variable size manager using Fenwick Tree (Binary Indexed Tree).
 * Supports dynamic growth with batched expansion.
 */
export class VariableSizeManager implements SizeManager {
    private sizes: number[] = []
    private tree: number[] = [0] // 1-based Fenwick tree
    private count: number = 0

    private _defaultSize: number

    constructor(defaultSize: number = 30) {
        this._defaultSize = defaultSize
        this.rebuildTree();
    }

    get defaultSize(): number {
        return this._defaultSize;
    }

    set defaultSize(value: number) {
        this.setDefaultSize(value);
    }

    // -----------------------------
    // Public API
    // -----------------------------

    getSize(index: number): number {
        const size = this.sizes[index]
        if (size === undefined || size < 0)
            return this._defaultSize
        return size
    }

    update(index: number, newSize: number): void {
        // Grow if needed
        if (index >= this.count) {
            this._growTo(index * 2)
        }

        const oldSize = this.getSize(index)
        const delta = newSize - oldSize

        if (delta === 0) return

        this.sizes[index] = newSize
        this._add(index, delta)
    }

    /**
     * Returns prefix sum [0..index)
     */
    getOffset(index: number): number {
        if (index <= 0) return 0

        let sum = 0
        let i = Math.min(index, this.count)

        while (i > 0) {
            sum += this.tree[i]
            i -= i & -i
        }

        // handle virtual tail (default sizes beyond known range)
        if (index > this.count) {
            sum += (index - this.count) * this._defaultSize
        }

        return sum
    }

    findIndex(offset: number): number {
        if (this.count === 0) {
            return Math.floor(offset / this._defaultSize)
        }

        let i = 0
        let bit = 1 << Math.floor(Math.log2(this.count))

        let sum = 0

        while (bit !== 0) {
            const t = i + bit
            if (t <= this.count && sum + this.tree[t] <= offset) {
                sum += this.tree[t]
                i = t
            }
            bit >>= 1
        }

        if (i === this.count) {
            const remaining = offset - sum
            return i + Math.floor(remaining / this._defaultSize)
        }

        return i
    }


    private setDefaultSize(size: number): void {
        if (this._defaultSize === size) return

        this._defaultSize = size

        this.rebuildTree()
    }

    /**
     * Grows the internal structures to accommodate the new count.
     */
    private _growTo(newCount: number): void {
        if (newCount <= this.count) return

        const oldCount = this.count

        // Extend sizes array with markers (-1 means default size)
        for (let i = oldCount; i < newCount; i++) {
            this.sizes[i] = -1
        }

        this.count = newCount

        this.rebuildTree()
    }

    /**
     * Rebuilds Fenwick tree from sizes array.
     */
    private rebuildTree(): void {
        this.tree = new Array(this.count + 1).fill(0)

        for (let i = 0; i < this.count; i++) {
            this._add(i, this.getSize(i))
        }
    }

    /**
     * Fenwick tree point update.
     */
    private _add(index: number, delta: number): void {
        let i = index + 1

        while (i <= this.count) {
            this.tree[i] += delta
            i += i & -i
        }
    }
}
