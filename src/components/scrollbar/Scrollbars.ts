import { ElgoraUI, type Disposable } from "../../core/ElgoraUI";
import { Throttle } from "../../core/Throttle";
import { ScrollbarView } from "./ScrollbarView";
import type { ScrollbarMode } from "./ScrollbarMode";

/** Presentation shared with ScrollEngine; native browser scrolling remains enabled. */
export interface ScrollbarsOptions {
    /** Defaults to thin. Applies to every scrollbar owned by an installation. */
    scrollbarMode?: ScrollbarMode;
    /** Mouse proximity in CSS pixels that expands each scrollbar independently. Defaults to 50. */
    scrollbarHoverDistance?: number;
}

/** A native scroll viewport with custom scrollbar presentation. */
export interface ScrollbarsHandle extends Disposable {
    /** Scrollable element, or the document scrolling element for a Window attachment. */
    readonly element: HTMLElement;
    /** Current presentation mode for this viewport; assignment updates its scrollbar views. */
    scrollbarMode: ScrollbarMode;
    /** Mouse proximity threshold in CSS pixels; zero enables direct scrollbar hover only. */
    scrollbarHoverDistance: number;
    /** Rechecks dimensions and position immediately, bypassing the automatic 30 Hz throttle. */
    refresh(): void;
}

/** Owns automatically discovered native scroll viewports in a Window or container subtree. */
export interface ScrollbarsInstallation extends Disposable {
    /** Presentation mode propagated to all attachments owned by this installation. */
    scrollbarMode: ScrollbarMode;
    /** Mouse proximity threshold for every attachment owned by this installation. Defaults to 50. */
    scrollbarHoverDistance: number;
    /** Discovers new viewports and updates existing ones immediately, bypassing automatic throttling. */
    refresh(): void;
}

const attached = new WeakMap<HTMLElement, NativeScrollbars>();
const installed = new WeakMap<HTMLElement | Window, NativeScrollbarsInstallation>();
const windowInstallations = new WeakMap<Window, Set<NativeScrollbarsInstallation>>();
const overlaySelector = "[data-elg-scrollbars-overlay]";
const excludedSelector = `${overlaySelector}, [data-elg-scroll-engine]`;
const refreshInterval = 1000 / 30;
const motionEvents = ["animationstart", "animationend", "animationcancel", "transitionrun", "transitionend", "transitioncancel"] as const;
function isWindow(target: HTMLElement | Window): target is Window { return (target as Window).window === target; }
function isOverlay(node: Node): boolean {
    return !!(node.nodeType === 1 ? node as Element : node.parentElement)?.closest(overlaySelector);
}

/** The innermost registered container wins; Window is the fallback scope. */
function nearestInstallation(element: HTMLElement): NativeScrollbarsInstallation | undefined {
    for (let node: HTMLElement | null = element; node; node = node.parentElement) {
        const installation = installed.get(node);
        if (installation) return installation;
    }
    const win = element.ownerDocument.defaultView;
    return win ? installed.get(win) : undefined;
}

function refreshInstallations(win: Window): void { windowInstallations.get(win)?.forEach(installation => installation.refresh()); }
function scheduleInstallations(win: Window): void { windowInstallations.get(win)?.forEach(installation => installation.schedule()); }

/**
 * Adds custom scrollbars to native scroll containers or an entire document.
 * Wheel, touch, keyboard navigation and scrollIntoView remain browser-managed.
 * @example const handle = Scrollbars.attach(panel, { scrollbarMode: "thin" });
 * @example const installation = Scrollbars.install(window); // installation.dispose() restores native scrollbars.
 */
export class Scrollbars {
    /**
     * Attaches once to an existing scroll container, textarea or Window.
     * Repeated calls return the same handle; options update its presentation.
     * An automatic attachment becomes explicitly owned, so installations cannot change or dispose it.
     * The element's overflow, children and inline styles are preserved.
     * @example const handle = Scrollbars.attach(window); handle.scrollbarMode = "always";
     */
    static attach(target: HTMLElement | Window, options: ScrollbarsOptions = {}): ScrollbarsHandle {
        ScrollbarView.validateHoverDistance(options.scrollbarHoverDistance ?? 50);
        const win = isWindow(target) ? target : target.ownerDocument.defaultView!;
        const element = isWindow(target) ? win.document.scrollingElement as HTMLElement : target;
        if (!element) throw new Error("Failed to attach scrollbars. The document has no scrolling element yet.");
        if (element.closest(excludedSelector))
            throw new Error("Failed to attach scrollbars. The element already belongs to a custom scroll viewport.");
        let handle = attached.get(element);
        if (!handle) {
            handle = new NativeScrollbars(element, win, element === win.document.scrollingElement, options);
            attached.set(element, handle);
        } else {
            handle.owner?.release(handle);
            if (options.scrollbarMode !== undefined) handle.scrollbarMode = options.scrollbarMode;
            if (options.scrollbarHoverDistance !== undefined) handle.scrollbarHoverDistance = options.scrollbarHoverDistance;
        }
        return handle;
    }

    /**
     * Enhances a container and its descendants, or the native scroll viewports in one Window.
     * Observes DOM and layout changes, skipping ScrollEngine-owned subtrees.
     * The closest container installation wins; explicit attach() calls have highest priority.
     * Disposing a local installation returns its viewports to a surrounding installation.
     * Iframes and shadow roots are not traversed. Dispose before releasing the application.
     * @example const installation = Scrollbars.install(window, { scrollbarMode: "thin" });
     * @example const dialogScrollbars = Scrollbars.install(dialog, { scrollbarMode: "always" });
     */
    static install(target: HTMLElement | Window, options: ScrollbarsOptions = {}): ScrollbarsInstallation {
        ScrollbarView.validateHoverDistance(options.scrollbarHoverDistance ?? 50);
        const win = isWindow(target) ? target : target.ownerDocument.defaultView!;
        let installation = installed.get(target);
        if (!installation) {
            installation = new NativeScrollbarsInstallation(target, win, options);
            installed.set(target, installation);
            let scopes = windowInstallations.get(win);
            if (!scopes) windowInstallations.set(win, scopes = new Set());
            scopes.add(installation);
            refreshInstallations(win);
        } else {
            if (options.scrollbarMode !== undefined) installation.scrollbarMode = options.scrollbarMode;
            if (options.scrollbarHoverDistance !== undefined) installation.scrollbarHoverDistance = options.scrollbarHoverDistance;
        }
        return installation;
    }
}

/** Native coordinate adapter; overlay controls never become part of the scroll content. */
class NativeScrollbars implements ScrollbarsHandle {
    /** Undefined means explicitly owned by the caller of attach(). */
    owner?: NativeScrollbarsInstallation;
    private readonly overlay: HTMLDivElement;
    private readonly bars: ScrollbarView;
    private readonly resize: ResizeObserver;
    private readonly mutations: MutationObserver;
    private readonly hadHiddenClass: boolean;
    private disposed = false;
    private mode: ScrollbarMode;
    private readonly observedChildren = new Set<Element>();
    private readonly refreshThrottle = new Throttle(() => ElgoraUI.scheduler.schedule(this.refresh), refreshInterval);
    private readonly animations = new Set<Animation>();
    private animationTimer?: number;

    constructor(readonly element: HTMLElement, private readonly win: Window, private readonly page: boolean, options: ScrollbarsOptions) {
        this.mode = options.scrollbarMode ?? "thin";
        this.hadHiddenClass = element.classList.contains("elg-scrollable");
        element.classList.add("elg-scrollable");
        this.overlay = element.ownerDocument.createElement("div");
        this.overlay.className = "elg-scroll-container elg-native-scrollbars";
        this.overlay.setAttribute("data-elg-scrollbars-overlay", "");
        this.overlay.setAttribute("aria-hidden", "true");
        // Top-layer pickers require overlays within the same top-layer ancestor.
        (element.closest("[popover], dialog") ?? element.ownerDocument.body ?? element.ownerDocument.documentElement).append(this.overlay);
        this.bars = new ScrollbarView(this.overlay, this.mode, (axis, ratio) => {
            if (axis === "x") element.scrollLeft = (win.getComputedStyle(element).direction === "rtl" ? -(1 - ratio) : ratio) * Math.max(0, element.scrollWidth - this.width);
            else element.scrollTop = ratio * Math.max(0, element.scrollHeight - this.height);
            this.bars.flash(); this.refresh();
        }, { hoverTarget: page ? win.document.documentElement : element, hoverDistance: options.scrollbarHoverDistance });
        this.resize = new ResizeObserver(this.schedule);
        this.resize.observe(element);
        this.mutations = new MutationObserver(records => { if (records.some(record => !isOverlay(record.target))) this.schedule(); });
        this.mutations.observe(element, { subtree: true, childList: true, characterData: true, attributes: true });
        element.ownerDocument.addEventListener("scroll", this.scrolled, true);
        element.ownerDocument.addEventListener("toggle", this.settled, true);
        for (const event of motionEvents) element.ownerDocument.addEventListener(event, this.motionChanged, true);
        win.addEventListener("resize", this.schedule);
        element.addEventListener("load", this.schedule, true);
        element.addEventListener("input", this.schedule);
        this.overlay.addEventListener("wheel", this.wheel, { passive: false });
        this.refresh();
        // An automatic installation may discover a viewport after animationstart.
        for (let node: HTMLElement | null = element; node; node = node.parentElement) this.watchMotion(node);
    }

    get scrollbarMode(): ScrollbarMode { return this.mode; }
    set scrollbarMode(value: ScrollbarMode) { if (!this.disposed) { this.mode = value; this.bars.mode = value; } }
    get scrollbarHoverDistance(): number { return this.bars.hoverDistance; }
    set scrollbarHoverDistance(value: number) { if (!this.disposed) this.bars.hoverDistance = value; }
    private get width(): number { return this.page ? this.win.document.documentElement.clientWidth : this.element.clientWidth; }
    private get height(): number { return this.page ? this.win.document.documentElement.clientHeight : this.element.clientHeight; }
    private schedule = (): void => { if (!this.disposed) this.refreshThrottle.call(); };
    private settled = (event: Event): void => {
        const target = event.target as Element | null;
        if (this.disposed || !target?.contains(this.element)) return;
        this.refreshThrottle.cancel();
        ElgoraUI.scheduler.schedule(this.refresh);
    };
    private motionChanged = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        if (!target || isOverlay(target) || (!target.contains(this.element) && !this.element.contains(target))) return;
        if (event.type === "animationstart" || event.type === "transitionrun") this.watchMotion(target);
        // End/cancel can change a fixed containing block without resizing anything.
        this.refreshThrottle.cancel();
        ElgoraUI.scheduler.schedule(this.refresh);
    };
    private watchMotion(target: HTMLElement): void {
        if (this.disposed || typeof target.getAnimations !== "function") return;
        const root = this.element.closest("[popover], dialog");
        // Both viewport and overlay inherit this ancestor's transform. Layout
        // size changes are already covered by ResizeObserver; no frame loop needed.
        if (root && target.contains(root)) return;
        for (const animation of target.getAnimations()) {
            const effect = animation.effect;
            if (!(effect && "getKeyframes" in effect) || (animation.playState !== "running" && !animation.pending)) continue;
            const geometric = (effect as KeyframeEffect).getKeyframes().some(frame => Object.keys(frame)
                .some(key => /^(transform|translate|rotate|scale|perspective|width|height|minWidth|maxWidth|minHeight|maxHeight|inset|top|right|bottom|left|margin|padding|border(?:Top|Right|Bottom|Left)?Width|fontSize|fontFamily|fontWeight|lineHeight|gap|flex|grid)/.test(key)));
            if (geometric) this.animations.add(animation);
        }
        if (this.animations.size && this.animationTimer === undefined) this.followMotion();
    }
    private followMotion = (): void => {
        this.animationTimer = undefined;
        if (this.disposed) return;
        for (const animation of this.animations)
            if (animation.playState !== "running" && !animation.pending) this.animations.delete(animation);
        this.schedule(); // Only this attachment is refreshed, never document discovery.
        if (this.animations.size) this.animationTimer = this.win.setTimeout(this.followMotion, refreshInterval);
    };
    private scrolled = (event: Event): void => {
        if (event.target === this.element || (this.page && event.target === this.element.ownerDocument)) this.bars.flash();
        this.schedule(); // Ancestor scrolling also changes overlay position and clipping.
    };
    private wheel = (event: WheelEvent): void => {
        const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.height : 1;
        this.element.scrollLeft += (event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX) * multiplier;
        this.element.scrollTop += (event.shiftKey && !event.deltaX ? 0 : event.deltaY) * multiplier;
        event.preventDefault(); this.bars.flash(); this.schedule();
    };

    /** Updates scroll geometry through the shared frame scheduler or an explicit refresh call. */
    readonly refresh = (): void => {
        if (this.disposed) return;
        const element = this.element;
        const width = this.width, height = this.height;
        if (!element.isConnected || width <= 0 || height <= 0 || !element.getClientRects().length) {
            this.overlay.style.display = "none"; return;
        }
        const style = this.win.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const root = element.closest<HTMLElement>("[popover], dialog");
        const host = root ?? element.ownerDocument.body ?? element.ownerDocument.documentElement;
        if (this.overlay.parentElement !== host) host.append(this.overlay);
        // A fixed child of a transformed popover uses the popover as its
        // containing block. Viewport coordinates then create phantom overflow.
        // Absolute coordinates within that same root follow scale/translation
        // naturally, including during entry animation, without per-frame work.
        const scaleX = this.page ? 1 : rect.width / (element.offsetWidth || rect.width) || 1;
        const scaleY = this.page ? 1 : rect.height / (element.offsetHeight || rect.height) || 1;
        const rootRect = root?.getBoundingClientRect();
        const rootScaleX = root && rootRect ? rootRect.width / (root.offsetWidth || rootRect.width) || 1 : 1;
        const rootScaleY = root && rootRect ? rootRect.height / (root.offsetHeight || rootRect.height) || 1 : 1;
        const left = this.page ? 0 : rect.left + element.clientLeft * scaleX;
        const top = this.page ? 0 : rect.top + element.clientTop * scaleY;
        const visualWidth = width * scaleX, visualHeight = height * scaleY;
        const overlayLeft = root && rootRect ? (left - rootRect.left) / rootScaleX - root.clientLeft + root.scrollLeft : left;
        const overlayTop = root && rootRect ? (top - rootRect.top) / rootScaleY - root.clientTop + root.scrollTop : top;
        const overlayWidth = visualWidth / rootScaleX, overlayHeight = visualHeight / rootScaleY;
        // Read real content extents before writing overlay styles. The overlay
        // must fit the viewport so it never becomes part of those extents.
        const scrollWidth = element.scrollWidth, scrollHeight = element.scrollHeight;
        let clipLeft = Math.max(0, -left), clipTop = Math.max(0, -top);
        let clipRight = Math.max(0, left + visualWidth - this.win.innerWidth), clipBottom = Math.max(0, top + visualHeight - this.win.innerHeight);
        for (let ancestor = this.page || root === element ? null : element.parentElement; ancestor; ancestor = ancestor.parentElement) {
            const overflow = this.win.getComputedStyle(ancestor);
            const bounds = ancestor.getBoundingClientRect();
            const sx = bounds.width / (ancestor.offsetWidth || bounds.width) || 1;
            const sy = bounds.height / (ancestor.offsetHeight || bounds.height) || 1;
            if (/auto|scroll|hidden|clip/.test(overflow.overflowX)) {
                clipLeft = Math.max(clipLeft, bounds.left + ancestor.clientLeft * sx - left);
                clipRight = Math.max(clipRight, left + visualWidth - bounds.left - (ancestor.clientLeft + ancestor.clientWidth) * sx);
            }
            if (/auto|scroll|hidden|clip/.test(overflow.overflowY)) {
                clipTop = Math.max(clipTop, bounds.top + ancestor.clientTop * sy - top);
                clipBottom = Math.max(clipBottom, top + visualHeight - bounds.top - (ancestor.clientTop + ancestor.clientHeight) * sy);
            }
            if (ancestor === root) break; // Top-layer content escapes outer ancestor clips.
        }
        const canScroll = (overflow: string) => this.page ? !/hidden|clip/.test(overflow) : /auto|scroll/.test(overflow);
        const showX = canScroll(style.overflowX || style.overflow) && scrollWidth > width + 0.5;
        const showY = canScroll(style.overflowY || style.overflow) && scrollHeight > height + 0.5;
        Object.assign(this.overlay.style, { display: "block", position: root ? "absolute" : "fixed",
            left: `${overlayLeft}px`, top: `${overlayTop}px`, width: `${overlayWidth}px`, height: `${overlayHeight}px`,
            clipPath: `inset(${clipTop / rootScaleY}px ${clipRight / rootScaleX}px ${clipBottom / rootScaleY}px ${clipLeft / rootScaleX}px)` });
        for (const name of ["--elg-text-h", "--elg-text-s", "--elg-text-l"]) this.overlay.style.setProperty(name, style.getPropertyValue(name));
        this.bars.horizontal.style.display = showX ? "block" : "none";
        this.bars.vertical.style.display = showY ? "block" : "none";
        this.overlay.classList.toggle("elg-scrollbar-both", showX && showY);
        const trackWidth = Math.max(0, overlayWidth - (showY ? 12 : 0));
        const trackHeight = Math.max(0, overlayHeight - (showX ? 12 : 0));
        const thumbWidth = Math.min(trackWidth, Math.max(20, width / Math.max(width, scrollWidth) * trackWidth));
        const thumbHeight = Math.min(trackHeight, Math.max(20, height / Math.max(height, scrollHeight) * trackHeight));
        this.bars.horizontalThumb.style.width = `${thumbWidth}px`;
        this.bars.verticalThumb.style.height = `${thumbHeight}px`;
        const ratioX = Math.min(1, Math.abs(element.scrollLeft) / Math.max(1, scrollWidth - width));
        this.bars.horizontalThumb.style.transform = `translateX(${(style.direction === "rtl" ? 1 - ratioX : ratioX) * (trackWidth - thumbWidth)}px)`;
        this.bars.verticalThumb.style.transform = `translateY(${Math.max(0, element.scrollTop) / Math.max(1, scrollHeight - height) * (trackHeight - thumbHeight)}px)`;
        for (const child of [...this.observedChildren]) if (child.parentElement !== element) { this.resize.unobserve(child); this.observedChildren.delete(child); }
        for (const child of element.children) if (!isOverlay(child) && !this.observedChildren.has(child)) { this.resize.observe(child); this.observedChildren.add(child); }
        this.bars.refreshHover();
    };

    /** Restores the original native scrollbar class and releases only this attachment's resources. */
    dispose(): void {
        if (this.disposed) return;
        this.owner?.release(this);
        this.disposed = true;
        this.resize.disconnect(); this.mutations.disconnect(); this.observedChildren.clear();
        this.refreshThrottle.cancel(); this.animations.clear();
        if (this.animationTimer !== undefined) this.win.clearTimeout(this.animationTimer);
        this.element.ownerDocument.removeEventListener("scroll", this.scrolled, true);
        this.element.ownerDocument.removeEventListener("toggle", this.settled, true);
        for (const event of motionEvents) this.element.ownerDocument.removeEventListener(event, this.motionChanged, true);
        this.win.removeEventListener("resize", this.schedule);
        this.element.removeEventListener("load", this.schedule, true);
        this.element.removeEventListener("input", this.schedule);
        this.overlay.removeEventListener("wheel", this.wheel);
        this.bars.dispose(); this.overlay.remove();
        if (!this.hadHiddenClass) this.element.classList.remove("elg-scrollable");
        attached.delete(this.element);
        scheduleInstallations(this.win);
    }
}

/** Scoped discovery and ownership transfer, reconciled through the frame scheduler. */
class NativeScrollbarsInstallation implements ScrollbarsInstallation {
    private readonly owned = new Set<NativeScrollbars>();
    private readonly observed = new Set<Element>();
    private readonly mutations: MutationObserver;
    private readonly resize: ResizeObserver;
    private disposed = false;
    private mode: ScrollbarMode;
    private hoverDistance: number;
    private readonly root: HTMLElement;
    private readonly refreshThrottle = new Throttle(() => ElgoraUI.scheduler.schedule(this.refresh), refreshInterval);

    constructor(private readonly target: HTMLElement | Window, private readonly win: Window, options: ScrollbarsOptions) {
        this.root = isWindow(target) ? win.document.documentElement : target;
        this.mode = options.scrollbarMode ?? "thin";
        this.hoverDistance = options.scrollbarHoverDistance ?? 50;
        this.mutations = new MutationObserver(records => {
            if (records.some(record => this.affectsScope(record))) this.schedule();
        });
        // The document observation also detects moving or removing the scope itself.
        this.mutations.observe(win.document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
        if (!isWindow(target)) this.mutations.observe(this.root, { subtree: true, childList: true, attributes: true, characterData: true });
        this.resize = new ResizeObserver(this.schedule);
        this.resize.observe(this.root);
        win.addEventListener("resize", this.schedule);
        this.root.addEventListener("load", this.schedule, true);
        win.document.fonts?.addEventListener("loadingdone", this.schedule);
        // Initial discovery runs after registration, so nested ownership is independent of creation order.
    }

    private affectsScope(record: MutationRecord): boolean {
        const element = record.target.nodeType === 1 ? record.target as Element : record.target.parentElement;
        if (isOverlay(record.target) || element?.closest("[data-elg-scroll-engine]")) return false;
        if (isWindow(this.target) || this.root.contains(record.target)) return true;
        if (record.type === "attributes" && element?.contains(this.root)) return true;
        return record.type === "childList" && [...record.addedNodes, ...record.removedNodes]
            .some(node => node === this.root || node.contains(this.root));
    }

    get scrollbarMode(): ScrollbarMode { return this.mode; }
    set scrollbarMode(value: ScrollbarMode) {
        if (this.disposed) return;
        this.mode = value; this.owned.forEach(handle => { handle.scrollbarMode = value; });
    }
    get scrollbarHoverDistance(): number { return this.hoverDistance; }
    set scrollbarHoverDistance(value: number) {
        if (this.disposed) return;
        this.hoverDistance = ScrollbarView.validateHoverDistance(value);
        this.owned.forEach(handle => { handle.scrollbarHoverDistance = value; });
    }

    /** Stops automatic ownership without touching the attachment or its scroll state. */
    release(handle: NativeScrollbars): void {
        this.owned.delete(handle);
        if (handle.owner === this) handle.owner = undefined;
        if (handle.element !== this.root && this.observed.delete(handle.element)) this.resize.unobserve(handle.element);
    }

    /** Transfers an existing overlay, including its native scroll position, without recreating it. */
    private adopt(handle: NativeScrollbars): void {
        handle.owner?.release(handle);
        handle.owner = this; this.owned.add(handle);
        handle.scrollbarMode = this.mode;
        handle.scrollbarHoverDistance = this.hoverDistance;
        this.resize.observe(handle.element); this.observed.add(handle.element);
    }

    /** Native candidates must be connected, in this document, and outside virtual-scroll subtrees. */
    private eligible(element: HTMLElement): boolean {
        if (!element.isConnected || element.ownerDocument !== this.win.document || element.closest(excludedSelector)) return false;
        if (element === this.win.document.scrollingElement) return true;
        if (element.namespaceURI !== "http://www.w3.org/1999/xhtml") return false;
        const style = this.win.getComputedStyle(element);
        return /auto|scroll/.test(style.overflowX + style.overflowY + style.overflow);
    }

    readonly schedule = (): void => { if (!this.disposed) this.refreshThrottle.call(); };

    /** Reconciles this scope with the nearest installation and explicit attachment ownership. */
    readonly refresh = (): void => {
        if (this.disposed) return;
        const candidates = new Set<HTMLElement>();
        for (const element of [this.root, ...this.root.querySelectorAll<HTMLElement>("*")]) {
            if (nearestInstallation(element) !== this || !this.eligible(element)) continue;
            candidates.add(element);
        }
        for (const handle of [...this.owned]) {
            const nextOwner = nearestInstallation(handle.element);
            if (nextOwner !== this) {
                this.release(handle);
                if (nextOwner && nextOwner.eligible(handle.element)) nextOwner.adopt(handle);
                else handle.dispose();
            } else if (!candidates.has(handle.element)) handle.dispose();
        }
        for (const element of candidates) {
            let handle = attached.get(element);
            if (handle && !handle.owner) continue; // Explicit attach() always has priority.
            if (!handle) {
                handle = new NativeScrollbars(element, this.win, element === this.win.document.scrollingElement, {
                    scrollbarMode: this.mode, scrollbarHoverDistance: this.hoverDistance
                });
                attached.set(element, handle);
            }
            if (handle.owner !== this) this.adopt(handle);
            handle.refresh();
        }
    };

    /** Releases this scope; surrounding scopes immediately resume eligible automatic attachments. */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        installed.delete(this.target);
        const scopes = windowInstallations.get(this.win);
        scopes?.delete(this);
        if (!scopes?.size) windowInstallations.delete(this.win);
        this.mutations.disconnect(); this.resize.disconnect(); this.observed.clear();
        this.refreshThrottle.cancel();
        this.win.removeEventListener("resize", this.schedule);
        this.root.removeEventListener("load", this.schedule, true);
        this.win.document.fonts?.removeEventListener("loadingdone", this.schedule);
        for (const handle of [...this.owned]) {
            this.release(handle);
            const nextOwner = nearestInstallation(handle.element);
            if (nextOwner && nextOwner.eligible(handle.element)) nextOwner.adopt(handle);
            else handle.dispose();
        }
        refreshInstallations(this.win);
    }
}
