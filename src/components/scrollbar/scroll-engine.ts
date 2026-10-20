import { ScrollbarView } from "./ScrollbarView";
import type { ScrollbarMode } from "./ScrollbarMode";
export type { ScrollbarMode } from "./ScrollbarMode";
import type { Disposable } from "../../core/ElgoraUI";

/** Presentation options for an existing scroll viewport. */
export interface ScrollEngineOptions {
    /** Thin at rest, hidden until interaction, or always full-width. Defaults to thin. */
    scrollbarMode?: ScrollbarMode;
    /** Mouse proximity in CSS pixels that expands each scrollbar independently. Defaults to 50. */
    scrollbarHoverDistance?: number;
    /** Space above the vertical scrollbar track, in CSS pixels, for fixed headers. Defaults to 0.
     * Affects track/thumb geometry only; virtual scroll coordinates and range stay unchanged. */
    verticalScrollbarTop?: number;
}

/** Custom scroll container supporting virtual dimensions and multiple input modes. */
export class ScrollEngine implements Disposable {
    /** The viewport element enhanced by this scroll engine. */
    public readonly dom: HTMLElement;

    // Virtual Dimensions & Coordinates (Can be billions of pixels)
    private _scrollWidth: number = 0;
    private _scrollHeight: number = 0;
    private _scrollLeft: number = 0;
    private _scrollTop: number = 0;
    private _maxScrollLeft: number = 0;
    private _maxScrollTop: number = 0;

    // Client Dimensions
    private _clientWidth: number = 0;
    private _clientHeight: number = 0;

    // Physical Dimension Limits to bypass browser rendering limits (~10M px is highly stable)
    private readonly _MAX_PHYSICAL_SIZE = 10000000;
    private _physicalScrollWidth: number = 0;
    private _physicalScrollHeight: number = 0;
    private _scaleX: number = 1;
    private _scaleY: number = 1;

    // Custom Scrollbar Elements
    private _hTrack!: HTMLDivElement;
    private _hThumb!: HTMLDivElement;
    private _vTrack!: HTMLDivElement;
    private _vThumb!: HTMLDivElement;

    // Desktop Dragging Tracking Properties
    private _bars!: ScrollbarView;
    private _onScrollCallback?: () => void;
    private _onResizeCallback?: () => void;

    // Mobile Inertia Kinetic Touch Tracking Properties
    private _touchStartX: number = 0;
    private _touchStartY: number = 0;
    private _lastTouchX: number = 0;
    private _lastTouchY: number = 0;
    private _velocityX: number = 0;
    private _velocityY: number = 0;
    private _lastTouchTime: number = 0;
    private _inertiaFrameId: number | null = null;
    private _isTouching: boolean = false;
    private _resizeObserver?: ResizeObserver;
    private _disposed = false;
    private _scrollbarMode: ScrollbarMode = "thin";
    private _scrollbarHoverDistance = 50;
    private _verticalScrollbarTop = 0;

    /** Creates a scroll engine for an existing viewport element. */
    constructor(dom: HTMLElement, options: ScrollEngineOptions = {}) {
        this._scrollbarHoverDistance = ScrollbarView.validateHoverDistance(options.scrollbarHoverDistance ?? 50);
        this._verticalScrollbarTop = this.validateVerticalScrollbarTop(options.verticalScrollbarTop ?? 0);
        this.dom = dom;
        this._clientWidth = dom.clientWidth;
        this._clientHeight = dom.clientHeight;
        this.setupContainer();
        this.scrollbarMode = options.scrollbarMode ?? "thin";
        this.createScrollbars();
        this.bindEvents();
    }

    /** Total virtual content width configured for the viewport. */
    public get scrollWidth(): number { return this._scrollWidth; }
    /** Total virtual content height configured for the viewport. */
    public get scrollHeight(): number { return this._scrollHeight; }
    /** Current horizontal virtual scroll position. */
    public get scrollLeft(): number { return this._scrollLeft; }
    /** Sets the horizontal virtual scroll position, clamped to valid bounds. */
    public set scrollLeft(left: number) { this.scrollTo(left, this._scrollTop); }

    /** Current vertical virtual scroll position. */
    public get scrollTop(): number { return this._scrollTop; }
    /** Sets the vertical virtual scroll position, clamped to valid bounds. */
    public set scrollTop(top: number) { this.scrollTo(this._scrollLeft, top); }
    /** Maximum horizontal virtual scroll position. */
    public get maxScrollLeft(): number { return this._maxScrollLeft; }
    /** Maximum vertical virtual scroll position. */
    public get maxScrollTop(): number { return this._maxScrollTop; }
    /** Current physical viewport width in CSS pixels. */
    public get clientWidth(): number { return this._clientWidth; }
    /** Current physical viewport height in CSS pixels. */
    public get clientHeight(): number { return this._clientHeight; }

    /** Requested top inset of the vertical track in CSS pixels, clamped to viewport height when rendered. */
    public get verticalScrollbarTop(): number { return this._verticalScrollbarTop; }
    /** Moves the track below fixed content without scrolling or notifying onScroll. Must be finite and non-negative. */
    public set verticalScrollbarTop(value: number) {
        if (this._disposed) return;
        this.validateVerticalScrollbarTop(value);
        if (value === this._verticalScrollbarTop) return;
        this._verticalScrollbarTop = value;
        this.updateScrollbarVisibilitiesAndSizes();
    }

    private validateVerticalScrollbarTop(value: number): number {
        if (!Number.isFinite(value) || value < 0)
            throw new Error("Failed to position vertical scrollbar. verticalScrollbarTop must be a finite non-negative number.");
        return value;
    }

    /** Current scrollbar presentation, independent of overflow and scroll coordinates. */
    public get scrollbarMode(): ScrollbarMode { return this._scrollbarMode; }
    /** Mouse proximity threshold in CSS pixels; zero enables direct scrollbar hover only. */
    public get scrollbarHoverDistance(): number { return this._scrollbarHoverDistance; }
    public set scrollbarHoverDistance(value: number) {
        if (this._disposed) return;
        this._scrollbarHoverDistance = ScrollbarView.validateHoverDistance(value);
        if (this._bars) this._bars.hoverDistance = value;
    }
    /** Changes presentation immediately without rebuilding content or moving the viewport. */
    public set scrollbarMode(value: ScrollbarMode) {
        if (this._disposed) return;
        this._scrollbarMode = value;
        this.dom.setAttribute("data-scrollbar-mode", value);
        if (this._bars) this._bars.mode = value;
    }

    /**
     * Updates the engine with virtual content dimensions. If a dimension exceeds
     * the browser-safe physical limit, the engine calculates an amplification ratio.
     * @param scrollWidth Total virtual content width.
     * @param scrollHeight Total virtual content height.
     */
    public updateDimensions(scrollWidth: number, scrollHeight: number): void {
        if (this._disposed) return;
        this._scrollWidth = scrollWidth;
        this._scrollHeight = scrollHeight;

        const viewWidth = this._clientWidth;
        const viewHeight = this._clientHeight;

        // Calculate Horizontal Scale
        if (this._scrollWidth > this._MAX_PHYSICAL_SIZE) {
            this._physicalScrollWidth = this._MAX_PHYSICAL_SIZE;
            // Scale ratio for the remaining scrollable distance
            this._scaleX = (this._scrollWidth - viewWidth) / (this._physicalScrollWidth - viewWidth);
        } else {
            this._physicalScrollWidth = this._scrollWidth;
            this._scaleX = 1;
        }

        // Calculate Vertical Scale
        if (this._scrollHeight > this._MAX_PHYSICAL_SIZE) {
            this._physicalScrollHeight = this._MAX_PHYSICAL_SIZE;
            this._scaleY = (this._scrollHeight - viewHeight) / (this._physicalScrollHeight - viewHeight);
        } else {
            this._physicalScrollHeight = this._scrollHeight;
            this._scaleY = 1;
        }

        // Update max scroll values
        this._maxScrollLeft = Math.max(0, this._scrollWidth - viewWidth);
        this._maxScrollTop = Math.max(0, this._scrollHeight - viewHeight);

        // Clamp existing coordinates to new maximum dimensions
        this.scrollTo(this._scrollLeft, this._scrollTop);
        this.updateScrollbarVisibilitiesAndSizes();
    }

    /**
     * Scrolls programmatically using virtual coordinates.
     * @param left Target horizontal virtual position.
     * @param top Target vertical virtual position.
     */
    public scrollTo(left: number, top: number): void {
        if (this._disposed) return;
        const maxLeft = this.getMaxScrollLeft();
        const maxTop = this.getMaxScrollTop();

        const nextLeft = Math.max(0, Math.min(left, maxLeft));
        const nextTop = Math.max(0, Math.min(top, maxTop));

        if (nextLeft !== this._scrollLeft || nextTop !== this._scrollTop) {
            this._scrollLeft = nextLeft;
            this._scrollTop = nextTop;

            this.updateThumbPositions();
            this._bars.flash();

            if (this._onScrollCallback) {
                this._onScrollCallback();
            }
        }
    }



    /** Registers a callback invoked after the virtual scroll position changes. */
    public onScroll(callback: () => void): void {
        if (this._disposed) return;
        this._onScrollCallback = callback;
    }

    /** Registers a callback invoked after the physical viewport is resized. */
    public onResize(callback: () => void): void {
        if (this._disposed) return;
        this._onResizeCallback = callback;
    }

    /**
     * Releases all event listeners, observers, animation frames, and custom
     * scrollbar elements owned by the engine. The viewport and its content
     * remain owned by the caller.
     */
    public dispose(): void {
        if (this._disposed) return;
        this._disposed = true;

        this.dom.removeEventListener('wheel', this.handleWheel);
        this.dom.removeEventListener('keydown', this.handleKeyDown);
        this.dom.removeEventListener('touchstart', this.handleTouchStart);
        this.dom.removeEventListener('touchmove', this.handleTouchMove);
        this.dom.removeEventListener('touchend', this.handleTouchEnd);
        this.dom.removeEventListener('touchcancel', this.handleTouchEnd);

        this._resizeObserver?.disconnect();
        this._resizeObserver = undefined;

        if (this._inertiaFrameId !== null) {
            cancelAnimationFrame(this._inertiaFrameId);
            this._inertiaFrameId = null;
        }

        this._bars.dispose();
        this.dom.removeAttribute('data-elg-scroll-engine');
        this.dom.classList.remove('elg-scrolling', 'elg-scrollbar-both');
        this._onScrollCallback = undefined;
        this._onResizeCallback = undefined;
        this._isTouching = false;
    }

    private getMaxScrollLeft(): number { return Math.max(0, this._scrollWidth - this._clientWidth); }
    private getMaxScrollTop(): number { return Math.max(0, this._scrollHeight - this._clientHeight); }

    private getMaxPhysicalScrollLeft(): number { return Math.max(0, this._physicalScrollWidth - this._clientWidth); }
    private getMaxPhysicalScrollTop(): number { return Math.max(0, this._physicalScrollHeight - this._clientHeight); }

    private setupContainer(): void {
        this.dom.classList.add("elg-scroll-container");
        this.dom.setAttribute("data-elg-scroll-engine", "");
        this.dom.style.position = this.dom.style.position || 'relative';
        this.dom.style.overflow = 'hidden';
        if (!this.dom.hasAttribute('tabindex')) this.dom.setAttribute('tabindex', '0');
    }

    private createScrollbars(): void {
        this._bars = new ScrollbarView(this.dom, this._scrollbarMode, (axis, ratio) => {
            this.scrollTo(axis === "x" ? ratio * this.getMaxScrollLeft() : this._scrollLeft,
                axis === "y" ? ratio * this.getMaxScrollTop() : this._scrollTop);
        }, { hoverDistance: this._scrollbarHoverDistance });
        this._hTrack = this._bars.horizontal; this._vTrack = this._bars.vertical;
        this._hThumb = this._bars.horizontalThumb; this._vThumb = this._bars.verticalThumb;
        this.updateScrollbarVisibilitiesAndSizes();
    }

    private bindEvents(): void {
        // Desktop input channels
        this.dom.addEventListener('wheel', this.handleWheel, { passive: false });
        this.dom.addEventListener('keydown', this.handleKeyDown);

        // Mobile touch swipe channels
        this.dom.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.dom.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.dom.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.dom.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

        this._resizeObserver = new ResizeObserver(() => {
            this._clientWidth = this.dom.clientWidth;
            this._clientHeight = this.dom.clientHeight;
            this._maxScrollLeft = Math.max(0, this._scrollWidth - this._clientWidth);
            this._maxScrollTop = Math.max(0, this._scrollHeight - this._clientHeight);
            this.updateScrollbarVisibilitiesAndSizes();
            this._onResizeCallback?.();
        });
        this._resizeObserver.observe(this.dom);
    }

    private handleWheel = (e: WheelEvent): void => {
        // A nested scroll viewport may already have consumed this gesture.
        if (e.defaultPrevented) return;
        let deltaX = e.deltaX;
        let deltaY = e.deltaY;

        // Shift Key Conversion Override
        // If shift is pressed and there is no native deltaX, route the vertical wheel movement horizontally
        if (e.shiftKey && deltaX === 0) {
            deltaX = deltaY;
            deltaY = 0;
        }

        if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
            deltaX *= 16;
            deltaY *= 16;
        } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            deltaX *= this._clientWidth;
            deltaY *= this._clientHeight;
        }

        const left = Math.max(0, Math.min(this._scrollLeft + deltaX, this.getMaxScrollLeft()));
        const top = Math.max(0, Math.min(this._scrollTop + deltaY, this.getMaxScrollTop()));
        // Leave native scroll chaining intact when neither axis can move in
        // the requested direction (including viewports with no overflow).
        if (left === this._scrollLeft && top === this._scrollTop) return;
        e.preventDefault();
        this.scrollTo(left, top);
    };

    private handleKeyDown = (e: KeyboardEvent): void => {
        const arrowStep = 40;
        switch (e.key) {
            case 'ArrowUp': this.scrollTo(this._scrollLeft, this._scrollTop - arrowStep); e.preventDefault(); break;
            case 'ArrowDown': this.scrollTo(this._scrollLeft, this._scrollTop + arrowStep); e.preventDefault(); break;
            case 'ArrowLeft': this.scrollTo(this._scrollLeft - arrowStep, this._scrollTop); e.preventDefault(); break;
            case 'ArrowRight': this.scrollTo(this._scrollLeft + arrowStep, this._scrollTop); e.preventDefault(); break;
            case 'PageUp': this.scrollTo(this._scrollLeft, this._scrollTop - this._clientHeight * 0.9); e.preventDefault(); break;
            case 'PageDown': this.scrollTo(this._scrollLeft, this._scrollTop + this._clientHeight * 0.9); e.preventDefault(); break;
            case 'Home': this.scrollTo(this._scrollLeft, 0); e.preventDefault(); break;
            case 'End': this.scrollTo(this._scrollLeft, this.getMaxScrollTop()); e.preventDefault(); break;
        }
    };

    private handleTouchStart = (e: TouchEvent): void => {
        if (this._inertiaFrameId) {
            cancelAnimationFrame(this._inertiaFrameId);
            this._inertiaFrameId = null;
        }
        const touch = e.touches[0];
        this._isTouching = true;
        this._touchStartX = this._lastTouchX = touch.clientX;
        this._touchStartY = this._lastTouchY = touch.clientY;
        this._velocityX = 0;
        this._velocityY = 0;
        this._lastTouchTime = performance.now();

        this.syncScrollActivity();
    };

    private handleTouchMove = (e: TouchEvent): void => {
        if (!this._isTouching) return;
        e.preventDefault();

        const touch = e.touches[0];
        const now = performance.now();
        const dt = now - this._lastTouchTime;

        const deltaX = this._lastTouchX - touch.clientX;
        const deltaY = this._lastTouchY - touch.clientY;

        // Only calculate velocity if we have a valid time difference
        if (dt > 0) {
            this._velocityX = deltaX / dt;
            this._velocityY = deltaY / dt;
        }

        this._lastTouchX = touch.clientX;
        this._lastTouchY = touch.clientY;
        this._lastTouchTime = now;

        this.scrollTo(this._scrollLeft + deltaX, this._scrollTop + deltaY);
    };

    private handleTouchEnd = (): void => {
        this._isTouching = false;

        const now = performance.now();
        const timeSinceLastMove = now - this._lastTouchTime;

        // 1. If the user held their finger still for more than 150ms before lifting, kill the velocity.
        // (1000ms is technically a full second, but in UX terms, holding still for even 150-200ms 
        // completely signals the intent to "stop". You can bump this up if you want it looser!)
        if (timeSinceLastMove > 150) {
            this._velocityX = 0;
            this._velocityY = 0;
        }

        // 2. Absolute velocity threshold check. If the dragging was incredibly slow, 
        // don't trigger the glide loop at all.
        const speed = Math.sqrt(this._velocityX * this._velocityX + this._velocityY * this._velocityY);
        const MIN_VELOCITY_THRESHOLD = 0.15; // Pixels per millisecond

        if (speed > MIN_VELOCITY_THRESHOLD) {
            this._lastTouchTime = performance.now();
            this._inertiaFrameId = requestAnimationFrame(this.glideLoop);
        } else {
            // Stop dead in tracks, clean up scrollbar container class
            this._velocityX = 0;
            this._velocityY = 0;
            this.syncScrollActivity();
        }
    };

    private glideLoop = (): void => {
        const now = performance.now();
        const dt = Math.min(now - this._lastTouchTime, 16);
        this._lastTouchTime = now;

        const friction = 0.95;
        this._velocityX *= Math.pow(friction, dt / 16);
        this._velocityY *= Math.pow(friction, dt / 16);

        const stepX = this._velocityX * dt;
        const stepY = this._velocityY * dt;

        this.scrollTo(this._scrollLeft + stepX, this._scrollTop + stepY);

        // Keep sliding until it crawls to a practical stop
        if (Math.abs(this._velocityX) > 0.05 || Math.abs(this._velocityY) > 0.05) {
            this._inertiaFrameId = requestAnimationFrame(this.glideLoop);
        } else {
            this._inertiaFrameId = null;
            this.syncScrollActivity();
        }
    };

    /** Touch gestures and inertia keep auto-hidden scrollbars visible without expanding thin thumbs. */
    private syncScrollActivity(): void {
        this._bars.active = this._isTouching || this._inertiaFrameId !== null;
    }

    private updateScrollbarVisibilitiesAndSizes(): void {
        const viewWidth = this._clientWidth;
        const viewHeight = this._clientHeight;
        const top = Math.min(this._verticalScrollbarTop, viewHeight);
        const visibleHeight = Math.max(0, viewHeight - top);
        this._vTrack.style.top = `${top}px`;

        // Ignore subpixel overflow caused by fractional layout calculations. There is no useful
        // horizontal distance to scroll in that range, and exposing it causes a one-frame flash
        // while the browser rounds the rendered element width.
        const showH = this._scrollWidth > viewWidth + 0.5;
        const showV = this._scrollHeight > viewHeight && visibleHeight > 0;

        this._hTrack.style.display = showH ? 'block' : 'none';
        this._vTrack.style.display = showV ? 'block' : 'none';

        // Toggles your exact layout rule `.elg-scrollbar-both`
        if (showH && showV) {
            this.dom.classList.add('elg-scrollbar-both');
        } else {
            this.dom.classList.remove('elg-scrollbar-both');
        }

        // Base thumb sizes on exact current client widths/heights of custom track frames
        const hTrackWidth = this._hTrack.clientWidth;
        const vTrackHeight = this._vTrack.clientHeight;
        const hThumbWidth = Math.min(hTrackWidth, Math.max(20,
            (viewWidth / Math.max(1, this._physicalScrollWidth)) * hTrackWidth));
        // The excluded header occupies both viewport and virtual content height. Its
        // pixels must not make the thumb look like additional scrollable body rows.
        const vThumbHeight = Math.min(vTrackHeight, Math.max(20,
            (visibleHeight / Math.max(1, this._physicalScrollHeight - top)) * vTrackHeight));

        this._hThumb.style.width = `${hThumbWidth}px`;
        this._vThumb.style.height = `${vThumbHeight}px`;

        this.updateThumbPositions();
        this._bars.refreshHover();
    }

    private updateThumbPositions(): void {
        const maxPhysicalLeft = this.getMaxPhysicalScrollLeft();
        const maxPhysicalTop = this.getMaxPhysicalScrollTop();

        const physicalLeft = maxPhysicalLeft > 0 ? (this._scrollLeft / this._scaleX) : 0;
        const physicalTop = maxPhysicalTop > 0 ? (this._scrollTop / this._scaleY) : 0;

        const hRatio = maxPhysicalLeft > 0 ? physicalLeft / maxPhysicalLeft : 0;
        const vRatio = maxPhysicalTop > 0 ? physicalTop / maxPhysicalTop : 0;

        const maxThumbLeft = Math.max(0, this._hTrack.clientWidth - this._hThumb.clientWidth);
        const maxThumbTop = Math.max(0, this._vTrack.clientHeight - this._vThumb.clientHeight);

        this._hThumb.style.transform = `translateX(${hRatio * maxThumbLeft}px)`;
        this._vThumb.style.transform = `translateY(${vRatio * maxThumbTop}px)`;
    }
}
