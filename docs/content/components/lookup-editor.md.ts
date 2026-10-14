import { LookupEditor, cdiv, e } from "../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] });
    const customers = Array.from({ length: 500 }, (_, index) => ({
        id: index + 1, name: "Customer " + String(index + 1).padStart(3, "0"),
        country: ["Bulgaria", "Germany", "France", "Spain"][index % 4]
    }));
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Selected customer ID: 1");
    const requests = e("div", { ui: ["text-muted"] });
    const editor = new LookupEditor<number, typeof customers[number]>({
        value: 1, label: "Customer", openOnFocus: true,
        columns: [{ name: "name", caption: "Customer", width: 240 }, { name: "country", caption: "Country", width: 150 }],
        loadItems: async ({ search, skip = 0, top = 50, abortSignal }) => {
            await new Promise<void>((resolve, reject) => {
                if (abortSignal?.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
                const abort = () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); };
                const timer = setTimeout(() => { abortSignal?.removeEventListener("abort", abort); resolve(); }, 180);
                abortSignal?.addEventListener("abort", abort, { once: true });
            });
            const matches = customers.filter(item => (item.name + " " + item.country).toLowerCase().includes(search.toLowerCase()));
            requests.textContent = `Request: search="${search}", skip=${skip}, top=${top}; ${matches.length} matches`;
            return { items: matches.slice(skip, skip + top), totalCount: matches.length };
        },
        getItemValue: item => item.id,
        getItemText: item => item.name,
        getValueText: id => customers.find(item => item.id === id)?.name ?? "",
        onCommit: async id => {
            status.textContent = "Accepting selection…";
            await new Promise(resolve => setTimeout(resolve, 250));
            status.textContent = "Selected customer ID: " + id;
        }
    });
    root.append([cdiv({ ui: ["d-flex", "flex-col", "gap-1"] }, e("span", {}, "Customer"), editor), status, requests]);
    root.mount(document.body);
}
