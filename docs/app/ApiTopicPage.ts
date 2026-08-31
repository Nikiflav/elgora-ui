import { Component } from "../../src/core/Component";
import { a, div, e, h2, p } from "../../src/core/e";
import { ApiEntry, ApiParameter, ApiReturn } from "./types-api";
import { TopicManifestEntry } from "./types";

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
        e("h3", { ui: ["elg", "m-0", "mt-2"] }, title),
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

/** Renders one generated API entry as a first-class documentation topic. */
export class ApiTopicPage extends Component {
    constructor(entry: ApiEntry, guideTopics: TopicManifestEntry[]) {
        const guides = guideTopics.filter(topic =>
            topic.api.includes(entry.name) || entry.topics?.includes(topic.path)
        );
        const properties = entry.members?.filter(member => member.kind === "property") || [];
        const methods = entry.members?.filter(member => member.kind === "method") || [];
        const events = entry.members?.filter(member => member.kind === "event") || [];
        const members = entry.members?.length ? div({ ui: ["elg", "d-flex", "flex-col", "gap-1"] },
            memberSection("Properties", properties),
            memberSection("Methods", methods),
            memberSection("Events", events)
        ) : null;

        const related = guides.length
            ? div({ ui: ["elg", "d-flex", "flex-col", "gap-1"] },
                e("h3", "Related guides"),
                ...guides.map(topic => a({
                    href: `?!=${topic.path}`,
                    ui: ["elg", "no-underline"]
                }, topic.title))
            ) : null;

        super({
            ui: ["elg", "d-flex", "flex-col", "gap-3"],
            children: [
                h2(entry.name),
                e("code", { ui: ["elg", "surface-3", "p-2", "overflow-auto"] }, `${entry.kind} ${entry.name}: ${entry.type}`),
                entry.description ? p(entry.description) : null,
                parametersSection(entry.parameters, entry.returns),
                members,
                related
            ]
        });
    }
}
