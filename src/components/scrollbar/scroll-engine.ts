import { div } from "../../core/e";


export class ScrollEngine {
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
    private _isDragging: 'horizontal' | 'vertical' | null = null;
    private _dragStartOffset: number = 0;
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

    constructor(dom: HTMLElement) {
        this.dom = dom;
        this._clientWidth = dom.clientWidth;
        this._clientHeight = dom.clientHeight;
        this.setupContainer();
        this.createScrollbars();
        this.bindEvents();
    }

    // Public getters for scroll state
    public get scrollWidth(): number { return this._scrollWidth; }
    public get scrollHeight(): number { return this._scrollHeight; }
    public get scrollLeft(): number { return this._scrollLeft; }
    public set scrollLeft(left: number) { this.scrollTo(left, this._scrollTop); }

    public get scrollTop(): number { return this._scrollTop; }
    public set scrollTop(top: number) { this.scrollTo(this._scrollLeft, top); }
    public get maxScrollLeft(): number { return this._maxScrollLeft; }
    public get maxScrollTop(): number { return this._maxScrollTop; }
    public get clientWidth(): number { return this._clientWidth; }
    public get clientHeight(): number { return this._clientHeight; }

    /**
     * Updates the engine with virtual sizes. If size exceeds max physical size,
     * it calculates an amplification ratio.
     */
    public updateDimensions(scrollWidth: number, scrollHeight: number): void {
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
     * Scroll programmatically using Virtual coordinates
     */
    public scrollTo(left: number, top: number): void {
        const maxLeft = this.getMaxScrollLeft();
        const maxTop = this.getMaxScrollTop();

        const nextLeft = Math.max(0, Math.min(left, maxLeft));
        const nextTop = Math.max(0, Math.min(top, maxTop));

        if (nextLeft !== this._scrollLeft || nextTop !== this._scrollTop) {
            this._scrollLeft = nextLeft;
            this._scrollTop = nextTop;

            this.updateThumbPositions();

            if (this._onScrollCallback) {
                this._onScrollCallback();
            }
        }
    }



    public onScroll(callback: () => void): void {
        this._onScrollCallback = callback;
    }

    public onResize(callback: () => void): void {
        this._onResizeCallback = callback;
    }

    private getMaxScrollLeft(): number { return Math.max(0, this._scrollWidth - this._clientWidth); }
    private getMaxScrollTop(): number { return Math.max(0, this._scrollHeight - this._clientHeight); }

    private getMaxPhysicalScrollLeft(): number { return Math.max(0, this._physicalScrollWidth - this._clientWidth); }
    private getMaxPhysicalScrollTop(): number { return Math.max(0, this._physicalScrollHeight - this._clientHeight); }

    private setupContainer(): void {
        this.dom.classList.add("elg-scroll-container");
        this.dom.style.position = this.dom.style.position || 'relative';
        this.dom.style.overflow = 'hidden';
        if (!this.dom.hasAttribute('tabindex')) this.dom.setAttribute('tabindex', '0');
    }

    private createScrollbars(): void {
        this._hThumb = div({ class: "elg-scrollbar-thumb" }) as HTMLDivElement;
        this._vThumb = div({ class: "elg-scrollbar-thumb" }) as HTMLDivElement;

        this._hTrack = div({ class: "elg-scrollbar elg-scrollbar-x" }, this._hThumb) as HTMLDivElement;
        this._vTrack = div({ class: "elg-scrollbar elg-scrollbar-y" }, this._vThumb) as HTMLDivElement;

        this.dom.appendChild(this._hTrack);
        this.dom.appendChild(this._vTrack);
    }

    private bindEvents(): void {
        // Desktop input channels
        this.dom.addEventListener('wheel', this.handleWheel, { passive: false });
        this.dom.addEventListener('keydown', this.handleKeyDown);

        // Pointer click + drag channels
        this._hThumb.addEventListener('pointerdown', (e) => this.startDrag(e, 'horizontal'));
        this._vThumb.addEventListener('pointerdown', (e) => this.startDrag(e, 'vertical'));

        window.addEventListener('pointermove', this.handleDrag);
        window.addEventListener('pointerup', this.stopDrag);

        this._hTrack.addEventListener('pointerdown', (e) => this.handleTrackClick(e, 'horizontal'));
        this._vTrack.addEventListener('pointerdown', (e) => this.handleTrackClick(e, 'vertical'));

        // Mobile touch swipe channels
        this.dom.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.dom.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.dom.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.dom.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

        new ResizeObserver(() => {
            this._clientWidth = this.dom.clientWidth;
            this._clientHeight = this.dom.clientHeight;
            this._maxScrollLeft = Math.max(0, this._scrollWidth - this._clientWidth);
            this._maxScrollTop = Math.max(0, this._scrollHeight - this._clientHeight);
            this.updateScrollbarVisibilitiesAndSizes();
            this._onResizeCallback?.();
        }).observe(this.dom);
    }

    private handleWheel = (e: WheelEvent): void => {
        e.preventDefault();
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

        this.scrollTo(this._scrollLeft + deltaX, this._scrollTop + deltaY);
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

    private startDrag(e: PointerEvent, orientation: 'horizontal' | 'vertical'): void {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        this._isDragging = orientation;
        this.dom.setPointerCapture(e.pointerId);

        if (orientation === 'horizontal') {
            this._dragStartOffset = e.clientX - this._hThumb.getBoundingClientRect().left;
            this.dom.classList.add('elg-scrolling');
        } else {
            this._dragStartOffset = e.clientY - this._vThumb.getBoundingClientRect().top;
            this.dom.classList.add('elg-scrolling');
        }
    }

    private handleDrag = (e: PointerEvent): void => {
        if (!this._isDragging) return;

        if (this._isDragging === 'horizontal') {
            const trackRect = this._hTrack.getBoundingClientRect();
            const relativeX = e.clientX - trackRect.left - this._dragStartOffset;
            const maxThumbLeft = trackRect.width - this._hThumb.clientWidth;

            const ratio = maxThumbLeft > 0 ? Math.max(0, Math.min(relativeX / maxThumbLeft, 1)) : 0;
            const virtualLeft = ratio * this.getMaxPhysicalScrollLeft() * this._scaleX;
            this.scrollTo(virtualLeft, this._scrollTop);
        } else {
            const trackRect = this._vTrack.getBoundingClientRect();
            const relativeY = e.clientY - trackRect.top - this._dragStartOffset;
            const maxThumbTop = trackRect.height - this._vThumb.clientHeight;

            const ratio = maxThumbTop > 0 ? Math.max(0, Math.min(relativeY / maxThumbTop, 1)) : 0;
            const virtualTop = ratio * this.getMaxPhysicalScrollTop() * this._scaleY;
            this.scrollTo(this._scrollLeft, virtualTop);
        }
    };

    private stopDrag = (e: PointerEvent): void => {
        if (!this._isDragging) return;
        try { this.dom.releasePointerCapture(e.pointerId); } catch { }
        this.dom.classList.remove('elg-scrolling');
        this._isDragging = null;
    };

    private handleTrackClick(e: PointerEvent, orientation: 'horizontal' | 'vertical'): void {
        if (e.target === this._hThumb || e.target === this._vThumb) return;

        if (orientation === 'horizontal') {
            const trackRect = this._hTrack.getBoundingClientRect();
            const clickX = e.clientX - trackRect.left - (this._hThumb.clientWidth / 2);
            const maxThumbLeft = trackRect.width - this._hThumb.clientWidth;

            const ratio = maxThumbLeft > 0 ? Math.max(0, Math.min(clickX / maxThumbLeft, 1)) : 0;
            const virtualLeft = ratio * this.getMaxPhysicalScrollLeft() * this._scaleX;
            this.scrollTo(virtualLeft, this._scrollTop);
        } else {
            const trackRect = this._vTrack.getBoundingClientRect();
            const clickY = e.clientY - trackRect.top - (this._vThumb.clientHeight / 2);
            const maxThumbTop = trackRect.height - this._vThumb.clientHeight;

            const ratio = maxThumbTop > 0 ? Math.max(0, Math.min(clickY / maxThumbTop, 1)) : 0;
            const virtualTop = ratio * this.getMaxPhysicalScrollTop() * this._scaleY;
            this.scrollTo(this._scrollLeft, virtualTop);
        }
    }

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

        this.dom.classList.add('elg-scrolling');
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
            this.dom.classList.remove('elg-scrolling');
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
            this.dom.classList.remove('elg-scrolling');
        }
    };

    private updateScrollbarVisibilitiesAndSizes(): void {
        const viewWidth = this._clientWidth;
        const viewHeight = this._clientHeight;

        const showH = this._scrollWidth > viewWidth;
        const showV = this._scrollHeight > viewHeight;

        this._hTrack.style.display = showH ? 'block' : 'none';
        this._vTrack.style.display = showV ? 'block' : 'none';

        // Toggles your exact layout rule `.elg-scrollbar-both`
        if (showH && showV) {
            this.dom.classList.add('elg-scrollbar-both');
        } else {
            this.dom.classList.remove('elg-scrollbar-both');
        }

        // Base thumb sizes on exact current client widths/heights of custom track frames
        const hThumbWidth = Math.max(20, (viewWidth / this._physicalScrollWidth) * this._hTrack.clientWidth);
        const vThumbHeight = Math.max(20, (viewHeight / this._physicalScrollHeight) * this._vTrack.clientHeight);

        this._hThumb.style.width = `${hThumbWidth}px`;
        this._vThumb.style.height = `${vThumbHeight}px`;

        this.updateThumbPositions();
    }

    private updateThumbPositions(): void {
        const maxPhysicalLeft = this.getMaxPhysicalScrollLeft();
        const maxPhysicalTop = this.getMaxPhysicalScrollTop();

        const physicalLeft = maxPhysicalLeft > 0 ? (this._scrollLeft / this._scaleX) : 0;
        const physicalTop = maxPhysicalTop > 0 ? (this._scrollTop / this._scaleY) : 0;

        const hRatio = maxPhysicalLeft > 0 ? physicalLeft / maxPhysicalLeft : 0;
        const vRatio = maxPhysicalTop > 0 ? physicalTop / maxPhysicalTop : 0;

        const maxThumbLeft = this._hTrack.clientWidth - this._hThumb.clientWidth;
        const maxThumbTop = this._vTrack.clientHeight - this._vThumb.clientHeight;

        this._hThumb.style.transform = `translateX(${hRatio * maxThumbLeft}px)`;
        this._vThumb.style.transform = `translateY(${vRatio * maxThumbTop}px)`;
    }
}