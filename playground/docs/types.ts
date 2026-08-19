import { Component } from "../../src/core/Component";

export interface ApiEntry {
    name: string;
    kind: string;
    type: string;
    description?: string;
    tags?: { name: string; text: string }[];
    members?: ApiMember[];
}

export interface ApiMember {
    name: string;
    kind: "property" | "method";
    type: string;
    signature?: string;
    description?: string;
    optional?: boolean;
}

export interface ApiDocsFile {
    exports: ApiEntry[];
}

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
