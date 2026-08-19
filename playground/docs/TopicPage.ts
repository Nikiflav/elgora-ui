import { Component } from "../../src/core/Component";
import { div, e, h1, p } from "../../src/core/e";
import { ApiReference } from "./ApiReference";
import { LiveExample } from "./LiveExample";
import { ApiDocsFile, DocumentationTopic } from "./types";

/** Shared documentation page with generated API reference and live examples. */
export class TopicPage extends Component {
    private readonly topic: DocumentationTopic;
    private readonly apiReference: ApiReference;
    private readonly examples: LiveExample[];

    constructor(topic: DocumentationTopic) {
        const apiReference = new ApiReference();
        const examples = topic.examples.map(example => new LiveExample(example));
        super({
            ui: ["d-flex", "flex-col", "gap-4"],
            style: { maxWidth: "1000px", width: "100%" },
            children: [
                div({ ui: ["elg", "box", "p-4"] }, h1(topic.title), p(topic.description)),
                apiReference,
                ...examples
            ]
        });
        this.topic = topic;
        this.apiReference = apiReference;
        this.examples = examples;
    }

    /** Loads generated API metadata and starts all live examples after page attachment. */
    async load(): Promise<void> {
        for (const example of this.examples) example.start();
        try {
            const response = await fetch("/playground/api-docs.json");
            const docs = await response.json() as ApiDocsFile;
            this.apiReference.setEntries(docs.exports.filter(entry => this.topic.api.includes(entry.name)));
        } catch {
            this.apiReference.setEntries([]);
        }
    }
}
