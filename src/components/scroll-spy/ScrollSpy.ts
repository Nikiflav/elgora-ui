import { Disposable, ElgoraUI } from "../../core/ElgoraUI";

/** Connects existing in-page navigation links to sections in a scrollable document. */
export interface ScrollSpyOptions {
    /** Content containing the link targets. Targets must have unique IDs. */
    container: HTMLElement;
    /** Navigation containing same-document anchor links. */
    navigation: HTMLElement;
    /** Scroll viewport. Defaults to the content's window. */
    scrollContainer?: HTMLElement | Window;
    /** Distance in pixels from the viewport top at which a section becomes active. Default: 24. */
    offset?: number;
    /** Class applied to the current link. Default: elg-scroll-spy-active. */
    activeClass?: string;
}

/**
 * Nonvisual, frame-batched scroll tracking for existing HTML navigation.
 * Does not intercept clicks or change the URL. Call refresh() after replacing
 * headings or links, and dispose() when the owning view is removed.
 * @example
 * const spy = new ScrollSpy({ container: article, navigation: toc });
 */
export class ScrollSpy implements Disposable {
    private entries: { link: HTMLAnchorElement; target: HTMLElement }[] = [];
    private readonly viewport: HTMLElement | Window;
    private readonly view: Window;
    private observer?: ResizeObserver;
    private disposed = false;
    private active?: HTMLAnchorElement;
    private previous = new Map<HTMLAnchorElement, { current: string | null; active: boolean }>();

    /** Attaches passive scroll listeners and schedules the initial selection. */
    constructor(private readonly options: ScrollSpyOptions) {
        this.view = options.container.ownerDocument.defaultView!;
        this.viewport = options.scrollContainer ?? this.view;
        this.viewport.addEventListener("scroll", this.schedule, { passive: true });
        this.view.addEventListener("resize", this.schedule);
        if (typeof ResizeObserver !== "undefined") this.observer = new ResizeObserver(this.schedule);
        this.refresh();
    }

    /** Rescans links and schedules measurement; safe to call before mounting. */
    refresh(): void {
        if (this.disposed) return;
        this.restore();
        this.entries = [];
        const document = this.options.container.ownerDocument;
        const current = new URL(document.URL);
        for (const link of this.options.navigation.querySelectorAll<HTMLAnchorElement>("a[href]")) {
            const url = new URL(link.href, document.baseURI);
            if (!url.hash || url.origin !== current.origin || url.pathname !== current.pathname || url.search !== current.search) continue;
            let id: string;
            try { id = decodeURIComponent(url.hash.slice(1)); } catch { continue; }
            // Avoid CSS selector escaping and never bind targets outside this content.
            const target = Array.from(this.options.container.querySelectorAll<HTMLElement>("[id]"))
                .find(element => element.id === id);
            if (!target) continue;
            this.entries.push({ link, target });
            this.previous.set(link, { current: link.getAttribute("aria-current"), active: link.classList.contains(this.activeClass) });
        }
        this.entries.sort((a, b) => a.target === b.target ? 0 :
            a.target.compareDocumentPosition(b.target) & 4 ? -1 : 1);
        this.observer?.disconnect();
        this.observer?.observe(this.options.container);
        for (const { target } of this.entries) this.observer?.observe(target);
        if (this.viewport !== this.view) this.observer?.observe(this.viewport as HTMLElement);
        this.schedule();
    }

    /** Releases listeners and restores the navigation's original attributes. */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.viewport.removeEventListener("scroll", this.schedule);
        this.view.removeEventListener("resize", this.schedule);
        this.observer?.disconnect();
        this.restore();
        this.entries = [];
    }

    private get activeClass(): string { return this.options.activeClass ?? "elg-scroll-spy-active"; }

    /** The shared scheduler deduplicates bursts of scroll and resize notifications. */
    private readonly schedule = (): void => {
        if (!this.disposed) ElgoraUI.scheduler.schedule(this.update);
    };

    private readonly update = (): void => {
        if (this.disposed || !this.options.container.isConnected) return;
        const element = this.viewport === this.view ? undefined : this.viewport as HTMLElement;
        const top = element ? element.getBoundingClientRect().top + element.clientTop : 0;
        const height = element ? element.clientHeight : this.view.innerHeight;
        const scroll = element ?? this.options.container.ownerDocument.scrollingElement;
        const visible = this.entries.filter(entry => entry.target.getClientRects().length > 0);
        let selected = visible[0];
        for (const entry of visible) {
            if (entry.target.getBoundingClientRect().top <= top + (this.options.offset ?? 24)) selected = entry;
        }
        // Short final sections cannot always reach the activation line.
        if (scroll && scroll.scrollHeight > height && scroll.scrollTop + height >= scroll.scrollHeight - 1)
            selected = visible[visible.length - 1];
        for (const { link } of this.entries) {
            const active = link === selected?.link;
            link.classList.toggle(this.activeClass, active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
        }
        if (selected && this.active !== selected.link) {
            const nav = this.options.navigation;
            const bounds = nav.getBoundingClientRect();
            const link = selected.link.getBoundingClientRect();
            // Scroll only the navigation, never its page ancestors.
            if (nav.clientHeight > 0 && nav.scrollHeight > nav.clientHeight) {
                if (link.top < bounds.top) nav.scrollTop += link.top - bounds.top;
                else if (link.bottom > bounds.top + nav.clientHeight) nav.scrollTop += link.bottom - bounds.top - nav.clientHeight;
            }
        }
        this.active = selected?.link;
    };

    private restore(): void {
        for (const [link, previous] of this.previous) {
            link.classList.toggle(this.activeClass, previous.active);
            if (previous.current === null) link.removeAttribute("aria-current");
            else link.setAttribute("aria-current", previous.current);
        }
        this.previous.clear();
        this.active = undefined;
    }
}
