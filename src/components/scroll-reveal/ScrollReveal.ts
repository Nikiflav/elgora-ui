import { ElgoraUI, type Disposable } from "../../core/ElgoraUI";

/** Viewport-triggered entrance animation configuration; no per-frame scroll handler is used. */
export interface ScrollRevealOptions {
    /** Elements to reveal within the container, including the container itself if it matches. */
    selector?: string;
    /** Default effect; data-elg-reveal="fade" or "fade-up" overrides it for a target. */
    effect?: "fade" | "fade-up";
    /** Scroll viewport. Omit for the document viewport; an element enables nested scrolling. */
    root?: Element | Document | null;
    /** Visible fraction required to enter, between 0 and 1. Defaults to 0.15. */
    threshold?: number;
    /** Observer root margin, in IntersectionObserver syntax. Defaults to 0px. */
    rootMargin?: string;
    /** Reveal once (default) or hide/reveal again as targets leave and enter. */
    once?: boolean;
    /** Delay in milliseconds between sibling targets, capped at 240ms per target. Defaults to 0. */
    stagger?: number;
}

const ownedClasses = ["elg-reveal-pending", "elg-reveal-visible", "elg-reveal-up"] as const;
type TargetState = { classes: boolean[]; delay: string; priority: string; revealed: boolean };

/**
 * Adds entrance effects to existing HTML or component-owned elements. Observations are
 * frame-batched through the UI scheduler; CSS owns the animation frames. Unsupported
 * browsers and reduced-motion users get visible content, without a polyfill.
 * @example
 * const reveal = new ScrollReveal(component.dom, { stagger: 60 });
 * component.addCleanup(reveal);
 * // Mark targets with data-elg-reveal="fade-up". Call refresh() after adding targets.
 */
export class ScrollReveal implements Disposable {
    private readonly targets = new Map<HTMLElement, TargetState>();
    private readonly pending = new Map<HTMLElement, boolean>();
    private readonly media?: MediaQueryList;
    private readonly observer?: IntersectionObserver;
    private readonly threshold: number;
    private disposed = false;

    /** Scans existing targets and starts observing; safe to construct before mounting the container. */
    constructor(private readonly container: HTMLElement, private readonly options: ScrollRevealOptions = {}) {
        this.threshold = options.threshold ?? .15;
        if (!Number.isFinite(this.threshold) || this.threshold < 0 || this.threshold > 1)
            throw new Error("Failed to create scroll reveal. threshold must be between 0 and 1.");
        if (options.stagger !== undefined && (!Number.isFinite(options.stagger) || options.stagger < 0))
            throw new Error("Failed to create scroll reveal. stagger must be a non-negative number.");
        const view = container.ownerDocument.defaultView;
        this.media = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
        const Observer = view?.IntersectionObserver;
        if (!Observer) return;
        try {
            this.observer = new Observer(entries => {
                if (this.disposed || this.media?.matches) return;
                for (const entry of entries) {
                    if (this.targets.has(entry.target as HTMLElement))
                        this.pending.set(entry.target as HTMLElement, entry.isIntersecting && entry.intersectionRatio >= this.threshold);
                }
                ElgoraUI.scheduler.schedule(this.flush);
            }, { root: options.root, rootMargin: options.rootMargin ?? "0px", threshold: this.threshold });
            this.refresh();
        } catch (error) {
            this.dispose();
            throw new Error(`Failed to create scroll reveal. ${error instanceof Error ? error.message : String(error)}`);
        }
        this.media?.addEventListener("change", this.motionChanged);
        this.container.addEventListener("focusin", this.focusChanged);
    }

    /** Observes newly added targets and releases removed ones; already revealed once-only targets stay visible. */
    refresh(): void {
        if (this.disposed || !this.observer) return;
        const selector = this.options.selector ?? "[data-elg-reveal]";
        const elements = new Set<HTMLElement>(this.container.querySelectorAll<HTMLElement>(selector));
        if (this.container.matches(selector)) elements.add(this.container);
        for (const [element, state] of this.targets) if (!elements.has(element)) {
            this.observer.unobserve(element); this.restore(element, state);
            this.targets.delete(element); this.pending.delete(element);
        }
        const siblingCounts = new Map<Element | null, number>();
        for (const element of elements) {
            const index = siblingCounts.get(element.parentElement) ?? 0;
            siblingCounts.set(element.parentElement, index + 1);
            if (this.targets.has(element)) continue;
            const state: TargetState = {
                classes: ownedClasses.map(name => element.classList.contains(name)),
                delay: element.style.getPropertyValue("--elg-reveal-delay"),
                priority: element.style.getPropertyPriority("--elg-reveal-delay"), revealed: !!this.media?.matches
            };
            this.targets.set(element, state);
            const effect = element.dataset.elgReveal || this.options.effect || "fade-up";
            element.classList.toggle("elg-reveal-up", effect === "fade-up");
            if (this.options.stagger) element.style.setProperty("--elg-reveal-delay", `${Math.min(index * this.options.stagger, 240)}ms`);
            if (!this.media?.matches) {
                element.classList.add("elg-reveal-pending"); this.observer.observe(element);
            }
        }
    }

    private readonly flush = (): void => {
        if (this.disposed) return;
        for (const [element, visible] of this.pending) {
            const state = this.targets.get(element);
            if (!state || ((this.options.once ?? true) && state.revealed)) continue;
            const focused = element.contains(element.ownerDocument.activeElement);
            const show = visible || focused || !!this.media?.matches;
            element.classList.toggle("elg-reveal-pending", !show);
            element.classList.toggle("elg-reveal-visible", show && !this.media?.matches && !focused);
            if (show) {
                state.revealed = true;
                if (this.options.once ?? true) this.observer?.unobserve(element);
            }
        }
        this.pending.clear();
    };

    private readonly focusChanged = (): void => {
        for (const element of this.targets.keys()) if (element.contains(element.ownerDocument.activeElement)) this.pending.set(element, true);
        ElgoraUI.scheduler.schedule(this.flush);
    };

    private readonly motionChanged = (): void => {
        if (this.disposed) return;
        this.observer?.disconnect(); this.pending.clear();
        for (const [element, state] of this.targets) {
            if (this.media?.matches) {
                element.classList.remove("elg-reveal-pending", "elg-reveal-visible"); state.revealed = true;
            } else if (!(this.options.once ?? true) || !state.revealed) this.observer?.observe(element);
        }
    };

    private restore(element: HTMLElement, state: TargetState): void {
        ownedClasses.forEach((name, index) => element.classList.toggle(name, state.classes[index]));
        if (state.delay) element.style.setProperty("--elg-reveal-delay", state.delay, state.priority);
        else element.style.removeProperty("--elg-reveal-delay");
    }

    /** Disconnects observers/listeners and restores owned classes/delays. Queued render work becomes a no-op. */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true; this.observer?.disconnect();
        this.media?.removeEventListener("change", this.motionChanged);
        this.container.removeEventListener("focusin", this.focusChanged);
        for (const [element, state] of this.targets) this.restore(element, state);
        this.targets.clear(); this.pending.clear();
    }
}
