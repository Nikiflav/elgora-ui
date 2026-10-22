import { Component } from "../../src/core/Component";
import { ApiEntry } from "./types-api";

export { ApiEntry, ApiMember, ApiManifest, ApiManifestEntry } from "./types-api";

export interface DocumentationExample {
    title: string;
    description: string;
    code: string;
    language?: "ts" | "js";
    createDemo(root: HTMLElement): void | Promise<void>;
}

export interface DocumentationTopic {
    path: string;
    title: string;
    description: string;
    api: string[];
    examples: DocumentationExample[];
}

export type DocumentationComponent = Component;

export interface MarkdownDemo {
    id: string;
    module?: string;
    source: string;
    sourceHtml?: string;
    code: string;
    mode?: "readonly" | "preview";
    height?: string;
}

export interface MarkdownTopic {
    id: string;
    title: string;
    path: string;
    group: string;
    parent?: string;
    order: number;
    description?: string;
    prev?: string;
    next?: string;
    toc?: boolean;
    api: string[];
    keywords: string[];
    html: string;
    demos: MarkdownDemo[];
}

export interface TopicManifestEntry {
    id: string;
    title: string;
    navTitle?: string;
    path: string;
    group: string;
    parent?: string;
    order: number;
    description?: string;
    prev?: string;
    next?: string;
    toc?: boolean;
    api: string[];
    keywords: string[];
    module: string;
    /** Legacy section ID followed by | and its replacement route/fragment. */
    sectionRedirects?: string[];
    headings?: { id: string; title: string }[];
}

/** Lightweight, separately loaded guide search data; live demo source is excluded. */
export interface TopicSearchEntry {
    path: string;
    sections: { id: string; title: string; text: string }[];
}

export interface TopicManifest {
    schemaVersion: number;
    topics: TopicManifestEntry[];
}

export interface ApiDocsFile {
    exports: ApiEntry[];
}
