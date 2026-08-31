import { MarkdownTopic, TopicManifestEntry } from "./types";

export class TopicLoader {
    private readonly cache = new Map<string, Promise<MarkdownTopic>>();

    load(entry: TopicManifestEntry): Promise<MarkdownTopic> {
        const cached = this.cache.get(entry.id);
        if (cached) return cached;

        const topic = import(/* @vite-ignore */ new URL(entry.module, document.baseURI).href)
            .then(module => module.default as MarkdownTopic);
        this.cache.set(entry.id, topic);
        return topic;
    }
}
