import { Component } from "../../src/core/Component";
import { a, div, e, h3, p } from "../../src/core/e";
import { ApiEntry } from "./types";
import { ApiParameter, ApiReturn } from "./types-api";

function parametersSection(parameters?: ApiParameter[], returns?: ApiReturn): HTMLElement | null {
    if (!parameters?.length && !returns) return null;
    return div({ ui: ["elg", "surface-2", "p-2", "d-flex", "flex-col", "gap-1"] },
        parameters?.length ? e("strong", { ui: ["elg", "fs-80"] }, "Parameters") : null,
        ...(parameters || []).map(parameter => e("div", { ui: ["elg", "d-flex", "flex-col"] },
            e("span", { ui: ["elg", "fs-80", "fw-500"] }, `${parameter.name}${parameter.optional ? "?" : ""}: ${parameter.type}`),
            parameter.description ? e("span", { ui: ["elg", "text-muted", "fs-80"] }, parameter.description) : null
        )),
        returns ? e("span", { ui: ["elg", "text-muted", "fs-80"] }, `Returns: ${returns.type}${returns.description ? ` — ${returns.description}` : ""}`) : null
    );
}

function memberSection(title: string, members: NonNullable<ApiEntry["members"]>): HTMLElement | null {
    if (!members.length) return null;
    return div({ ui: ["elg", "d-flex", "flex-col", "gap-1"] },
        e("h5", { ui: ["elg", "m-0", "mt-2"] }, title),
        ...members.map(member => div({
            ui: ["elg", "d-flex", "flex-col", "gap-1", "p-2", "border-bottom"]
        },
            e("span", { ui: ["elg", "d-block", "text-wrap", "fs-100", "fw-500"] }, member.kind === "method"
                ? `${member.name}${member.signature || "()"}`
                : `${member.name}: ${member.type}`
            ),
            member.kind === "method" ? parametersSection(member.parameters, member.returns) : null,
            member.description ? p({ ui: ["elg", "text-muted", "m-0"] }, member.description) : null
        ))
    );
}

/** Renders generated TypeScript API metadata for a documentation topic. */
export class ApiReference extends Component {
    private readonly content: HTMLElement;

    constructor() {
        const content = div({ ui: ["elg", "p-2", "d-flex", "flex-col", "gap-2"] }, "Loading API reference…");
        super({
            ui: ["d-flex", "flex-col", "gap-3"],
            children: [h3("API reference"), content]
        });
        this.content = content;
    }

    setEntries(entries: ApiEntry[]): void {
        const content = this.content;
        content.replaceChildren();

        for (const entry of entries) {
            const properties = entry.members?.filter(member => member.kind === "property") || [];
            const methods = entry.members?.filter(member => member.kind === "method") || [];
            const events = entry.members?.filter(member => member.kind === "event") || [];
            const members = entry.members?.length ? div({ ui: ["elg", "d-flex", "flex-col", "gap-1"] },
                memberSection("Properties", properties),
                memberSection("Methods", methods),
                memberSection("Events", events)
            ) : null;

            content.appendChild(div({ ui: ["d-flex", "flex-col", "gap-2"] },
                entry.path
                    ? a({ href: `?!=${entry.path}`, ui: ["elg", "fw-700", "no-underline"] }, entry.name)
                    : e("h4", entry.name),
                e("code", { ui: ["elg", "surface-3", "p-1", "overflow-auto"] }, `${entry.kind} ${entry.name}: ${entry.type}`),
                entry.description ? p(entry.description) : null,
                parametersSection(entry.parameters, entry.returns),
                members
            ));
        }

        if (!entries.length) content.appendChild(p("No generated API entries are mapped to this topic yet."));
    }
}
