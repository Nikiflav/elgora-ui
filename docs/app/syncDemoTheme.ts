/** Mirrors the docs theme into a demo document without restarting its example. */
export function syncDemoTheme(source: Document, target: Document): () => void {
    const sync = () => {
        const theme = source.documentElement.getAttribute("data-theme");
        if (theme === null) target.documentElement.removeAttribute("data-theme");
        else target.documentElement.setAttribute("data-theme", theme);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(source.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
}
