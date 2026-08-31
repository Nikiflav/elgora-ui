import { ApiEntry, ApiManifestEntry } from "./types-api";

/** Lazily loads and caches individual generated API topics. */
export class ApiLoader {
    private readonly cache = new Map<string, Promise<ApiEntry>>();

    load(entry: ApiManifestEntry): Promise<ApiEntry> {
        const cached = this.cache.get(entry.name);
        if (cached) return cached;

        const apiEntry = import(/* @vite-ignore */ new URL(entry.module, document.baseURI).href)
            .then(module => module.default as ApiEntry);
        this.cache.set(entry.name, apiEntry);
        return apiEntry;
    }
}
