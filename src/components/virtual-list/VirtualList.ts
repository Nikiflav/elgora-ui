import { Component } from "../../core/Component"
import { Scrollbar } from "../scrollbar/scrollbar"
import { VariableSizeManager } from "./SizeManager"

// --------------------------------------
// Data interfaces
// --------------------------------------

/**
 * Interface for a virtual list data source.
 */
/** Random-access data source consumed by a VirtualList. */
export interface VirtualDataSource<T> {
    count(): number
    getAt(index: number): T | undefined
}

/**
 * Interface for rendering a row in the virtual list.
 */
export type RenderRowArgs<T> = {
    /** The row html element. Users should add content to this element. */
    rowElement: HTMLElement

    /** The current width of the virtual list container. */
    readonly viewportWidth: number
    /** The current left scroll position of the virtual list container. May be used to implment horizontal virtual scrolling. */
    readonly scrollLeft: number
    /** The row data */
    readonly data: T
    /** The row visible index. */
    readonly index: number
}

/**
 * Options for the virtual list component.
 */
/** Construction options for a virtualized list component. */
export interface VirtualListOptions<T> {
    /** A virtual list data source. The data items are rendered as rows in the list.  */
    data: VirtualDataSource<T>
    /**
     * A function that renders a row in the virtual list. The user must append content to the row element.
     * @param args 
     * @returns 
     */
    renderRow: (args: RenderRowArgs<T>) => void
    /** Custom conent element for the virtual list. If not provided, a default DIV element will be used. */
    contentElement?: HTMLElement

    /** The element that contains the displayed rows and it's position is transformed by the virtual list component. */
    transformContentElement?: HTMLElement;
    /**
     * A function that creates a row element for the virtual list.
     * The element must be appended to the content element before being returned.
     * @param content The content element of the virtual list.
     * @returns The row element.
     */
    createRowElement?: (content: HTMLElement) => HTMLElement
    /** A function that is called before the virtual list is rendered. The content element is available at this point and all size and scroll offset properties are also available. */
    beforeRender?: () => void
    /** A function that is called after the virtual list is rendered. Can be used to measure DOM elements. */
    afterRender?: () => void
}

// --------------------------------------
// Internal types
// --------------------------------------

type PoolRow = {
    el: HTMLElement
    index: number
    data: any
}

type ViewRow<T> = {
    index: number
    height: number
    data: T | undefined
    el?: HTMLElement
}

type ViewInfo<T> = {
    rows: ViewRow<T>[]
    hiddenRows: ViewRow<T>[]
    totalRows: number
    totalHeight: number
    start: number
    startOffset: number
    firstVisibleIndex: number
    scrollFactor: number
}

// --------------------------------------
// VirtualList
// --------------------------------------

/** Efficiently renders only the visible portion of a large data collection. */
export class VirtualList<T> extends Component {

    private container: HTMLElement
    private content: HTMLElement
    private transformContent: HTMLElement;
    private spacer: HTMLElement

    private data: VirtualDataSource<T>
    private renderRow: (args: RenderRowArgs<T>) => void

    private sizeManager = new VariableSizeManager(30)
    private defaultRowSize = 0

    private createRowElement?: (content: HTMLElement) => HTMLElement;
    private beforeRender?: () => void;
    private afterRender?: () => void;


    private pool: PoolRow[] = []
    private prevView: ViewInfo<T> | null = null

    private _scrollTop = 0
    private _scrollLeft = 0
    private _viewportHeight = 0
    private _viewportWidth = 0
    private _startOffset = 0

    private totalHeight = 0

    private readonly maxScrollHeight = 12000000


    private dirtyRows = new Set<number>()
    private rafScheduled = false

    private readonly MAX_ROWS = 100

    constructor(options: VirtualListOptions<T>) {
        super()

        this.data = options.data
        this.renderRow = options.renderRow
        this.createRowElement = options.createRowElement;
        this.afterRender = options.afterRender;
        this.beforeRender = options.beforeRender;

        this.container = this.dom
        this.container.style.overflow = "auto"
        this.container.style.position = "relative"
        this.container.style.width = "100%"
        this.container.style.height = "100%"
        // Guard against infinite height containers (e.g. when mounted directly in body)
        this.container.style.maxHeight = "100vh"
        this.container.style.position = "relative"

        this.spacer = document.createElement("div");

        this.content = options.contentElement ?? document.createElement("div")
        this.content.style.position = "absolute"
        this.content.style.top = "0"
        this.content.style.left = "0"
        this.content.style.width = "100%"

        this.transformContent = options.transformContentElement ?? this.content;



        this.container.appendChild(this.spacer)
        this.container.appendChild(this.content)

        this.container.addEventListener("scroll", this.onScroll)

        this.renderTasks.push(() => this.frame())

    }

    /**
     * The horizontal scroll position
     */
    get scrollLeft() {
        return this._scrollLeft
    }

    /**
     * The vertical scroll position
     */
    get scrollTop() {
        return this._scrollTop
    }

    /**
     * The width of the viewport
     */
    get viewportWidth() {
        return this._viewportWidth
    }

    /**
     * The height of the viewport
     */
    get viewportHeight() {
        return this._viewportHeight
    }

    /**
     * The top offset of the content
     */
    get startOffset() {
        return this._startOffset
    }

    protected onMount(): void {

        this.refresh()
    }

    // --------------------------------------
    // Public API
    // --------------------------------------

    invalidateRow(index: number): void {
        this.dirtyRows.add(index)
        this.refresh()
    }

    // --------------------------------------
    // Scroll handling
    // --------------------------------------

    private onScroll = () => {

        this.requestRefreshFrame()
    }

    private requestRefreshFrame() {
        if (this.rafScheduled) return

        this.rafScheduled = true

        requestAnimationFrame(() => {
            this.rafScheduled = false
            this.refresh()
        })
    }

    // --------------------------------------
    // Frame pipeline
    // --------------------------------------



    private frame(): void {
        // Phase 1: READ all layout properties
        this._scrollTop = this.container.scrollTop
        this._scrollLeft = this.container.scrollLeft
        this._viewportHeight = this.container.clientHeight
        this._viewportWidth = this.container.clientWidth

        // Phase 2: COMPUTE (pure, no DOM access)
        const view = this.computeView(this._viewportHeight)

        this._startOffset = view.startOffset

        // Phase 3: WRITE (mutate DOM, no reads!)
        this.renderView(view, this._viewportWidth)

        // Phase 4: MEASURE (deferred to next frame to avoid forced reflow)
        requestAnimationFrame(() => this.measureAndAdjustScroll(view))

        if (this.afterRender) {
            requestAnimationFrame(this.afterRender)
        }
    }

    // --------------------------------------
    // Compute phase (PURE)
    // --------------------------------------


    /**
     * Computes the view to render based on current scroll position
     */
    private computeView(viewportHeight: number): ViewInfo<T> {

        const totalRows = this.data.count()

        const totalHeight = this.sizeManager.getOffset(totalRows)

        let scrollTop = this._scrollTop;
        let scrollFactor = 1;
        if (totalHeight > this.maxScrollHeight)
            scrollFactor = totalHeight / this.maxScrollHeight;
        scrollTop = Math.floor(scrollTop * scrollFactor);

        const firstVisibleIndex = this.sizeManager.findIndex(scrollTop)

        const start = Math.max(
            0,
            firstVisibleIndex - 5
        )

        const rows: ViewRow<T>[] = []
        const hiddenRows: ViewRow<T>[] = []

        const startOffset = this.sizeManager.getOffset(start)
        let y = startOffset

        for (let i = start; i < totalRows; i++) {

            const height = this.sizeManager.getSize(i)
            const data = this.data.getAt(i)

            rows.push({
                index: i,
                height,
                data: data
            })

            y += height

            if (rows.length >= this.MAX_ROWS)
                break

            if (y > scrollTop + viewportHeight + 500)
                break;
        }

        // Collect 5 hidden rows to measure their height in a hidden container.
        if (start > 10) {
            for (let i = start - 5; i < start; i++) {
                const height = this.sizeManager.getSize(i)
                const data = this.data.getAt(i)

                hiddenRows.push({
                    index: i,
                    height,
                    data: data
                })
            }
        }


        return {
            rows,
            hiddenRows,
            totalRows,
            totalHeight,
            start,
            startOffset,
            firstVisibleIndex,
            scrollFactor
        }
    }


    // --------------------------------------
    // Actual Render - Update DOM
    // --------------------------------------

    private renderView(view: ViewInfo<T>, viewportWidth: number): void {

        this.beforeRender?.();

        let p = 0
        for (const rowInfo of view.rows) {

            if (p >= this.pool.length) {
                let el: HTMLElement;
                if (this.createRowElement) {
                    el = this.createRowElement(this.content)
                }
                else {
                    el = document.createElement('div');
                    this.content.appendChild(el);
                }
                this.pool.push({
                    el,
                    index: -1,
                    data: undefined
                })

            }

            const poolRow = this.pool[p]
            rowInfo.el = poolRow.el

            const isDirty = this.dirtyRows.has(rowInfo.index)



            // content update
            if (
                isDirty ||
                poolRow.data !== rowInfo.data ||
                poolRow.index !== rowInfo.index
            ) {
                this.renderRow({
                    rowElement: poolRow.el,
                    data: rowInfo.data ?? { type: "empty", index: rowInfo.index } as T,
                    index: rowInfo.index,
                    viewportWidth: viewportWidth,
                    scrollLeft: this._scrollLeft
                })
            }

            poolRow.index = rowInfo.index
            poolRow.data = rowInfo.data


            poolRow.el.style.visibility = ""
            poolRow.el.style.display = ""


            if (isDirty) {
                this.dirtyRows.delete(rowInfo.index)
            }

            p++
        }

        // hide unused rows
        for (let i = p; i < this.pool.length; i++) {
            this.pool[i].el.style.display = "none"
        }

        //this.transformContent.style.transform = `translateY(${Math.floor(view.startOffset / view.scrollFactor)}px)`
        this.content.style.top = `${Math.floor(view.startOffset / view.scrollFactor)}px`
        if (this.totalHeight != view.totalHeight) {

            this.spacer.style.height = Math.floor(view.totalHeight / view.scrollFactor) + "px"
            this.totalHeight = view.totalHeight
        }

        this.prevView = view
    }

    // --------------------------------------
    // Measure phase (READ ONLY)
    // --------------------------------------

    private measureAndAdjustScroll(view: ViewInfo<T>): void {

        let changed = false
        let scrollDelta = 0;

        if (this.defaultRowSize == 0 && view.rows.length > 0) {

            let sum = 0;
            for (const row of view.rows) {
                const el = row.el!
                const measured = el.offsetHeight
                sum += measured
            }
            if (sum > 0)
                this.sizeManager.defaultSize = this.defaultRowSize = Math.round(sum / view.rows.length)
            //if (changed) this.refresh();
        }


        for (const row of view.rows) {

            const el = row.el!
            const measured = el.offsetHeight
            const prev = this.sizeManager.getSize(row.index)

            if (measured > 0 && measured !== prev) {
                this.sizeManager.update(row.index, measured)
                changed = true
                if (row.index < view.firstVisibleIndex) {
                    scrollDelta += measured - prev;
                }
            }
        }

        if (scrollDelta != 0)
            this.container.scrollTop += scrollDelta;



    }
}
