import { e } from "../../core/e";

type ScrollbarAxis = "x" | "y";

export class Scrollbar {

    private _container: HTMLElement;
    private _scrollable: HTMLElement;

    private _scroll: HTMLDivElement;
    private _thumb: HTMLDivElement;

    private _axis: ScrollbarAxis;

    private _isDragging = false;

    private _dragStartMouse = 0;
    private _dragStartScroll = 0;

    constructor(options: {
        container: HTMLElement,
        scrollable: HTMLElement,
        axis?: ScrollbarAxis
    }) {

        this._container = options.container;
        this._scrollable = options.scrollable;

        this._axis = options.axis ?? "y";

        this._container.classList.add("elg-scroll-container");

        this._scrollable.classList.add("elg-scrollable");

        this._thumb = e("div", {
            class: "elg-scrollbar-thumb"
        });

        this._scroll = e(
            "div",
            {
                class:
                    `elg-scrollbar elg-scrollbar-${this._axis}`
            },
            this._thumb
        );

        this._container.appendChild(this._scroll);

        this._scrollable.addEventListener(
            "scroll",
            () => {
                this.update();
            }
        );

        window.addEventListener(
            "resize",
            () => {
                this.update();
            }
        );

        this.initDragging();
        this.initTrackClick();

        this.update();
    }

    update() {

        const isX =
            this._axis === "x";

        const scrollSize = isX
            ? this._scrollable.scrollWidth
            : this._scrollable.scrollHeight;

        const clientSize = isX
            ? this._scrollable.clientWidth
            : this._scrollable.clientHeight;

        const scrollPos = isX
            ? this._scrollable.scrollLeft
            : this._scrollable.scrollTop;

        const maxScroll =
            scrollSize - clientSize;

        // nothing scrollable
        if (maxScroll <= 0) {

            this._scroll.style.display = "none";

            return;
        }

        this._scroll.style.display = "";

        const ratio =
            clientSize / scrollSize;

        const thumbSize = Math.max(
            clientSize * ratio,
            30
        );

        const maxThumbPos =
            clientSize - thumbSize;

        const thumbPos =
            (scrollPos / maxScroll) *
            maxThumbPos;

        if (isX) {

            this._thumb.style.width =
                `${thumbSize}px`;

            this._thumb.style.transform =
                `translateX(${thumbPos}px)`;

        }
        else {

            this._thumb.style.height =
                `${thumbSize}px`;

            this._thumb.style.transform =
                `translateY(${thumbPos}px)`;
        }
    }

    // ---------------------------------------------------
    // DRAGGING
    // ---------------------------------------------------

    private initDragging() {

        this._thumb.addEventListener(
            "mousedown",
            (e) => {

                e.preventDefault();
                e.stopPropagation();

                this._isDragging = true;

                this._scroll.classList.add("dragging");

                this._dragStartMouse =
                    this._axis === "x"
                        ? e.clientX
                        : e.clientY;

                this._dragStartScroll =
                    this._axis === "x"
                        ? this._scrollable.scrollLeft
                        : this._scrollable.scrollTop;

                document.addEventListener(
                    "mousemove",
                    this.onDrag
                );

                document.addEventListener(
                    "mouseup",
                    this.stopDrag
                );

                document.body.style.userSelect =
                    "none";
            }
        );
    }

    private onDrag = (e: MouseEvent) => {

        if (!this._isDragging) {
            return;
        }

        const currentMouse =
            this._axis === "x"
                ? e.clientX
                : e.clientY;

        const delta =
            currentMouse -
            this._dragStartMouse;

        const scrollSize =
            this._axis === "x"
                ? this._scrollable.scrollWidth
                : this._scrollable.scrollHeight;

        const clientSize =
            this._axis === "x"
                ? this._scrollable.clientWidth
                : this._scrollable.clientHeight;

        const thumbSize =
            this._axis === "x"
                ? this._thumb.offsetWidth
                : this._thumb.offsetHeight;

        const maxThumbTravel =
            clientSize - thumbSize;

        const maxScroll =
            scrollSize - clientSize;

        const scrollDelta =
            (delta / maxThumbTravel) *
            maxScroll;

        if (this._axis === "x") {

            this._scrollable.scrollLeft =
                this._dragStartScroll +
                scrollDelta;
        }
        else {

            this._scrollable.scrollTop =
                this._dragStartScroll +
                scrollDelta;
        }
    };

    private stopDrag = () => {

        this._isDragging = false;

        this._scroll.classList.remove("dragging");

        document.removeEventListener(
            "mousemove",
            this.onDrag
        );

        document.removeEventListener(
            "mouseup",
            this.stopDrag
        );

        document.body.style.userSelect =
            "";
    };

    // ---------------------------------------------------
    // TRACK CLICK
    // ---------------------------------------------------

    private initTrackClick() {

        this._scroll.addEventListener(
            "mousedown",
            (e) => {

                if (e.target === this._thumb) {
                    return;
                }

                const rect =
                    this._scroll.getBoundingClientRect();

                const clickPos =
                    this._axis === "x"
                        ? e.clientX - rect.left
                        : e.clientY - rect.top;

                const thumbSize =
                    this._axis === "x"
                        ? this._thumb.offsetWidth
                        : this._thumb.offsetHeight;

                const clientSize =
                    this._axis === "x"
                        ? this._scrollable.clientWidth
                        : this._scrollable.clientHeight;

                const maxThumbPos =
                    clientSize - thumbSize;

                const targetThumbPos =
                    clickPos - thumbSize / 2;

                const clampedThumbPos =
                    Math.max(
                        0,
                        Math.min(
                            targetThumbPos,
                            maxThumbPos
                        )
                    );

                const ratio =
                    clampedThumbPos /
                    maxThumbPos;

                const maxScroll =
                    (this._axis === "x"
                        ? this._scrollable.scrollWidth
                        : this._scrollable.scrollHeight)
                    - clientSize;

                if (this._axis === "x") {

                    this._scrollable.scrollLeft =
                        ratio * maxScroll;
                }
                else {

                    this._scrollable.scrollTop =
                        ratio * maxScroll;
                }
            }
        );
    }
}