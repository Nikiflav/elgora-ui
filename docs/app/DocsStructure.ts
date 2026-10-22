import type { TopicManifestEntry, TopicSearchEntry } from "./types";
import structure from "../structure.json";

/** One place for sidebar sections and non-page category labels. URLs remain independent. */
export const docsSections = structure.sections;
const categories = structure.categories;

export interface GuideLink {
    id: string;
    parent?: string;
    href: string;
    title: string;
    children?: GuideLink[];
}

export function guideLinks(topics: TopicManifestEntry[], group: string): GuideLink[] {
    const entries = topics.filter(t => t.group === group).map(t => ({
        id: t.id, parent: t.parent, href: t.path, title: t.navTitle || t.title, order: t.order, children: [] as GuideLink[]
    }));
    const nodes = [
        ...categories.filter(c => c.group === group).map(c => ({ ...c, href: "", parent: undefined as string | undefined, children: [] as GuideLink[] })),
        ...entries
    ].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    const byId = new Map(nodes.map(n => [n.id, n]));
    const roots: GuideLink[] = [];
    for (const node of nodes) {
        const parent = node.parent ? byId.get(node.parent) : undefined;
        if (parent) parent.children.push(node);
        else roots.push(node);
    }
    // A topic with children is still a real guide, not an inaccessible category header.
    for (const node of nodes) if (node.href && node.children.length) {
        node.children.unshift({ id: node.id + "-overview", title: "Overview", href: node.href });
    }
    return roots;
}

export function guideContext(topic: TopicManifestEntry, topics: TopicManifestEntry[]): string {
    const labels = [docsSections.find(s => s.group === topic.group)?.title || (topic.group === "documentation" ? "Documentation" : topic.group)];
    const seen = new Set([topic.id]);
    let parent = topic.parent;
    const ancestors: string[] = [];
    while (parent && !seen.has(parent)) {
        seen.add(parent);
        const entry = topics.find(t => t.id === parent) || categories.find(c => c.id === parent);
        if (!entry) break;
        ancestors.unshift("navTitle" in entry && typeof entry.navTitle === "string" ? entry.navTitle : entry.title);
        parent = "parent" in entry && typeof entry.parent === "string" ? entry.parent : undefined;
    }
    return [...labels, ...ancestors].join(" → ");
}

/** Unknown/malformed fragments are deliberately not redirected. */
export function sectionDestination(topic: TopicManifestEntry, hash: string): string | undefined {
    let anchor: string;
    try { anchor = decodeURIComponent(hash.replace(/^#/, "")); } catch { return undefined; }
    const redirect = topic.sectionRedirects?.find(value => value.slice(0, value.indexOf("|")) === anchor);
    return redirect?.slice(redirect.indexOf("|") + 1);
}

export interface GuideSearchResult { href: string; title: string; context: string; section?: string; score: number }

/** Rank all query words, preferring titles and section names to incidental prose. */
export function searchGuides(query: string, topics: TopicManifestEntry[], index: TopicSearchEntry[]): GuideSearchResult[] {
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const byPath = new Map(index.map(entry => [entry.path, entry]));
    const results: GuideSearchResult[] = [];
    for (const topic of topics) {
        if (topic.path === "/") continue;
        const context = guideContext(topic, topics);
        const heading = (topic.title + " " + context).toLocaleLowerCase();
        const description = (topic.description || "").toLocaleLowerCase();
        const keywords = topic.keywords.join(" ").toLocaleLowerCase();
        let best: GuideSearchResult | undefined;
        const sections = byPath.get(topic.path)?.sections || [{ id: "", title: "", text: "" }];
        for (const section of sections) {
            const label = section.title.toLocaleLowerCase(), body = section.text.toLocaleLowerCase();
            const scores = words.map(word => heading.includes(word) ? 100 : label.includes(word) ? 70 : keywords.includes(word) ? 40 : description.includes(word) ? 20 : body.includes(word) ? 1 : 0);
            if (scores.some(score => score === 0)) continue;
            const titleMatch = words.every(word => heading.includes(word) || keywords.includes(word));
            const score = scores.reduce<number>((sum, n) => sum + n, 0);
            const result = { href: topic.path + (!titleMatch && section.id ? "#" + section.id : ""), title: topic.title, context, section: titleMatch ? undefined : section.title || undefined, score };
            if (!best || result.score > best.score) best = result;
        }
        if (best) results.push(best);
    }
    return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 30);
}
