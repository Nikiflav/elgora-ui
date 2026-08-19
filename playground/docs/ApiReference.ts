import { Component } from "../../src/core/Component";
import { div, e, h3, p } from "../../src/core/e";
import { ApiEntry } from "./types";

/** Renders generated TypeScript API metadata for a documentation topic. */
export class ApiReference extends Component {
    constructor() {
        super({
            ui: ["d-flex", "flex-col", "gap-3"],
            children: [h3("API reference"), div({ className: "elg elg-doc-api-content" }, "Loading API reference…")]
        });
    }

    setEntries(entries: ApiEntry[]): void {
        const content = this.dom.querySelector<HTMLElement>(".elg-doc-api-content");
        if (!content) return;
        content.replaceChildren();

        for (const entry of entries) {
            const members = entry.members?.length
                ? div({ style: { overflowX: "auto" } },
                    e("table", { className: "elg elg-doc-api-table" },
                        e("thead", e("tr", e("th", "Name"), e("th", "Type"), e("th", "Description"))),
                        e("tbody", ...entry.members.map(member => e("tr",
                            e("td", e("code", member.name)),
                            e("td", e("code", member.signature || member.type)),
                            e("td", member.description || "")
                        )))
                    )
                ) : null;

            content.appendChild(div({ ui: ["d-flex", "flex-col", "gap-2"] },
                e("h4", entry.name),
                e("code", { className: "elg elg-doc-signature" }, `${entry.kind} ${entry.name}: ${entry.type}`),
                entry.description ? p(entry.description) : null,
                members
            ));
        }

        if (!entries.length) content.appendChild(p("No generated API entries are mapped to this topic yet."));
    }
}
