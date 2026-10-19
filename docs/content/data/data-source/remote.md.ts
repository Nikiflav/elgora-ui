import { cdiv, e, type DataSource, type QueryArgs, type DataResult } from "../../../../src/index";

export default function demo(): void {
    type Product = { id: number; name: string; price: number; stock: number };
    const catalog: Product[] = [
        { id: 1, name: "Wireless keyboard", price: 49, stock: 12 },
        { id: 2, name: "USB-C docking station", price: 189, stock: 5 },
        { id: 3, name: "Wireless mouse", price: 23, stock: 18 },
        { id: 4, name: "Laptop stand", price: 35, stock: 9 },
        { id: 5, name: "USB-C cable", price: 12, stock: 30 },
        { id: 6, name: "27-inch monitor", price: 249, stock: 4 },
        { id: 7, name: "Webcam", price: 69, stock: 7 },
        { id: 8, name: "Desk lamp", price: 39, stock: 11 }
    ];
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2"] });
    const filter = e("input", { ui: ["elg", "field", "min-w-0"], type: "search", ariaLabel: "Product name filter", placeholder: "Product name" });
    const fail = e("input", { type: "checkbox" });
    const status = e("p", { ui: ["m-0", "text-muted"], role: "status" });
    const pageInfo = e("span", { ui: ["text-muted"] });
    const queryInfo = e("pre", { ui: ["m-0", "fs-90", "overflow-auto"] });
    const body = e("tbody", {});
    const table = e("table", { ui: ["elg", "table", "table-row-borders", "w-100"] },
        e("thead", {}, e("tr", {}, ...["Product", "Price", "Stock"].map(text => e("th", {}, text)))), body);
    const button = (text: string) => e("button", { ui: ["elg", "btn", "neutral"], type: "button" }, text);
    const search = button("Search");
    const previous = button("Previous");
    const next = button("Next");
    const retry = button("Retry");
    let active: AbortController | undefined;
    let page = 0;
    let searchText = "";
    let total = 0;
    const pageSize = 3;

    // This replaces an HTTP endpoint. Cancellation is handled by the transport.
    async function requestProducts(args: QueryArgs, simulateFailure: boolean): Promise<{ items: Product[]; totalCount: number }> {
        await new Promise<void>((resolve, reject) => {
            const signal = args.abortSignal;
            if (signal?.aborted) { reject(new DOMException("Request cancelled", "AbortError")); return; }
            const abort = () => {
                clearTimeout(timer);
                signal?.removeEventListener("abort", abort);
                reject(new DOMException("Request cancelled", "AbortError"));
            };
            const timer = setTimeout(() => {
                signal?.removeEventListener("abort", abort);
                resolve();
            }, 450);
            signal?.addEventListener("abort", abort, { once: true });
        });
        if (args.abortSignal?.aborted) throw new DOMException("Request cancelled", "AbortError");
        if (simulateFailure) throw new Error("Failed to load products. The simulated API is unavailable.");
        const expression = args.filter as [string, string, unknown] | undefined;
        const text = expression ? String(expression[2]).toLowerCase() : "";
        const matches = catalog.filter(product => product.name.toLowerCase().includes(text));
        return { items: matches.slice(args.skip ?? 0, (args.skip ?? 0) + (args.top ?? matches.length)), totalCount: matches.length };
    }

    const source: DataSource<Product> = {
        async loadData(args: QueryArgs): Promise<DataResult<Product>> {
            if (args.groupBy?.length) return { args }; // No grouping support in this endpoint.
            const response = await requestProducts(args, fail.checked);
            return { args, dataItems: response.items,
                totalCount: args.requireTotalCount ? response.totalCount : undefined };
        }
    };

    async function load(): Promise<void> {
        active?.abort();
        const controller = new AbortController();
        active = controller;
        const args: QueryArgs = {
            filter: searchText ? ["name", "contains", searchText] : undefined,
            skip: page * pageSize, top: pageSize, requireTotalCount: true,
            abortSignal: controller.signal
        };
        status.textContent = "Loading products…";
        table.setAttribute("aria-busy", "true");
        previous.disabled = next.disabled = retry.disabled = true;
        queryInfo.textContent = JSON.stringify({ filter: args.filter, skip: args.skip, top: args.top, requireTotalCount: true }, null, 2);
        try {
            const result = await source.loadData(args);
            if (active !== controller || controller.signal.aborted) return;
            total = result.totalCount ?? 0;
            body.replaceChildren(...(result.dataItems ?? []).map(product => e("tr", {},
                e("td", {}, product.name), e("td", {}, "$" + product.price.toFixed(2)), e("td", {}, String(product.stock)))));
            status.textContent = total ? total + " matching products." : "No products match this filter.";
            pageInfo.textContent = "Page " + (page + 1) + " / " + Math.max(1, Math.ceil(total / pageSize));
            previous.disabled = page === 0;
            next.disabled = (page + 1) * pageSize >= total;
        } catch (error) {
            if (active !== controller || controller.signal.aborted) return;
            body.replaceChildren();
            pageInfo.textContent = "";
            status.textContent = error instanceof Error ? error.message : String(error);
            retry.disabled = false;
        } finally {
            if (active === controller) table.removeAttribute("aria-busy");
        }
    }

    function searchProducts(): void { searchText = filter.value.trim(); page = 0; void load(); }
    search.onclick = searchProducts;
    previous.onclick = () => { page--; void load(); };
    next.onclick = () => { page++; void load(); };
    retry.onclick = () => { void load(); };
    root.listen(filter, "keydown", event => {
        if ((event as KeyboardEvent).key === "Enter") { event.preventDefault(); searchProducts(); }
    });
    root.addCleanup(() => active?.abort());
    root.append([
        e("div", { ui: ["d-flex", "flex-wrap", "gap-2", "items-center"] }, filter, search,
            e("label", {}, fail, " Simulate request error")),
        e("div", { ui: ["overflow-auto"] }, table),
        e("div", { ui: ["d-flex", "flex-wrap", "gap-2", "items-center"] }, previous, next, pageInfo, retry),
        status, e("details", {}, e("summary", {}, "Current query"), queryInfo)
    ]);
    root.mount(document.body);
    void load();
}
