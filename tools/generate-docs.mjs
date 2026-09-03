import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const root = process.cwd();
const contentDir = path.join(root, "docs", "content");
const manifestFile = path.join(contentDir, "topics-manifest.json");
const topicsDir = path.join(contentDir, "topics");
const markdownIt = createRequire(path.join(root, "docs", "package.json"))("markdown-it");
const md = markdownIt({ html: true, linkify: true, typographer: true });
function extractDemoBody(source, fileName) {
    const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const statement = sourceFile.statements.find(node =>
        ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)
    );
    if (!statement || !statement.body) return source.trim();
    return source.slice(statement.body.getStart(sourceFile) + 1, statement.body.end - 1).trim();
}

function scalar(value) {
    const trimmed = value.trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

function parseFrontmatter(source, fileName) {
    if (!source.startsWith("---")) {
        throw new Error(`Topic ${fileName} is missing YAML frontmatter.`);
    }

    const end = source.indexOf("\n---", 3);
    if (end < 0) throw new Error(`Topic ${fileName} has an unclosed frontmatter block.`);

    const metadata = {};
    let listKey;
    for (const line of source.slice(3, end).split(/\r?\n/)) {
        if (!line.trim()) continue;
        const listItem = line.match(/^\s+-\s+(.+)$/);
        if (listItem && listKey) {
            metadata[listKey].push(scalar(listItem[1]));
            continue;
        }

        const match = line.match(/^([\w-]+):\s*(.*)$/);
        if (!match) throw new Error(`Invalid frontmatter in ${fileName}: ${line}`);
        const [, key, value] = match;
        if (value) {
            metadata[key] = scalar(value);
            listKey = undefined;
        } else {
            metadata[key] = [];
            listKey = key;
        }
    }

    return { metadata, body: source.slice(end + 4).replace(/^\r?\n/, "") };
}

function transpileDemoSource(source, fileName) {
    const result = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ESNext,
            removeComments: true
        },
        fileName
    });
    return result.outputText.trim();
}

function extractDemos(body, fileName, directory) {
    const demos = [];
    const externalPattern = /<live-demo\s+id="([^"]+)"(?:\s+mode="([^"]+)")?(?:\s+height="([^"]+)")?(?:\s+demo="([^"]+)")?(?:\s+src="([^"]+)")?\s*><\/live-demo>\s*(?:```js\s*\n[\s\S]*?```)?/g;
    const externalBody = body.replace(externalPattern, (_match, id, mode, height, demoName, source) => {
        const topicFileName = path.basename(fileName);
        const inferredSource = demoName ? `${topicFileName}.${demoName}.ts` : `${topicFileName}.ts`;
        const sourcePath = path.resolve(directory, source || inferredSource);
        if (!fs.existsSync(sourcePath)) {
            throw new Error("Demo source " + (source || inferredSource) + " for " + fileName + " does not exist.");
        }
        const sourceCode = fs.readFileSync(sourcePath, "utf8").trim();
        const demoBody = extractDemoBody(sourceCode, sourcePath);
        const compiledSource = transpileDemoSource(demoBody, sourcePath);
        const demoModule = "./content/" + path.relative(contentDir, sourcePath).replaceAll(path.sep, "/");
        demos.push({ id, module: demoModule, source: compiledSource, code: compiledSource, ...(mode === "readonly" ? { mode } : {}), ...(height ? { height } : {}) });
        return `<div data-live-demo="${id}"></div>`;
    });
    const demoPattern = /<live-demo\s+id="([^"]+)"(?:\s+mode="([^"]+)")?(?:\s+height="([^"]+)")?\s*><\/live-demo>\s*```js\s*\n([\s\S]*?)```/g;
    const renderedBody = externalBody.replace(demoPattern, (_match, id, mode, height, code) => {
        const sourceCode = code.trim();
        demos.push({ id, source: sourceCode, code: sourceCode, ...(mode === "readonly" ? { mode } : {}), ...(height ? { height } : {}) });
        return `<div data-live-demo="${id}"></div>`;
    });

    const unknownDemo = [...body.matchAll(/<live-demo\s+id="([^"]+)"/g)]
        .map(match => match[1])
        .filter(id => !demos.some(demo => demo.id === id));
    if (unknownDemo.length) {
        throw new Error(`Live demo ${unknownDemo.join(", ")} in ${fileName} must be followed by a js code block.`);
    }

    const normalizedBody = renderedBody.replace(
        /<api-reference\s+entries="([^"]+)"\s*><\/api-reference>/g,
        (_match, entries) => `<div data-api-reference="${entries}"></div>`
    );

    return { demos, renderedBody: normalizedBody };
}

function readTopics(directory, relative = "") {
    const topics = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        const childRelative = path.join(relative, entry.name);
        if (entry.isDirectory()) {
            topics.push(...readTopics(absolute, childRelative));
            continue;
        }
        if (!entry.name.endsWith(".md")) continue;

        const fileName = childRelative.replaceAll(path.sep, "/");
        const source = fs.readFileSync(absolute, "utf8");
        const { metadata, body } = parseFrontmatter(source, fileName);
        const { demos, renderedBody } = extractDemos(body, fileName, path.dirname(absolute));
        if (!metadata.id || !metadata.title || !metadata.path) {
            throw new Error(`Topic ${fileName} requires id, title, and path metadata.`);
        }

        topics.push({
            id: metadata.id,
            title: metadata.title,
            path: metadata.path,
            group: metadata.group || "general",
            parent: metadata.parent || undefined,
            order: metadata.order || 0,
            description: metadata.description || undefined,
            prev: metadata.prev || undefined,
            next: metadata.next || undefined,
            toc: metadata.toc !== false,
            api: metadata.api || [],
            keywords: metadata.keywords || [],
            html: md.render(renderedBody),
            demos
        });
    }
    return topics;
}

function validateUniqueTopicIds(topics) {
    const seen = new Map();
    for (const topic of topics) {
        const previous = seen.get(topic.id);
        if (previous) {
            throw new Error(`Duplicate documentation topic id "${topic.id}" for paths "${previous}" and "${topic.path}". Topic ids must be unique because they are used as generated module filenames.`);
        }
        seen.set(topic.id, topic.path);
    }
}

const topics = readTopics(contentDir)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
validateUniqueTopicIds(topics);

fs.mkdirSync(contentDir, { recursive: true });
fs.mkdirSync(topicsDir, { recursive: true });
const generatedTopicFiles = new Set(topics.map(topic => topic.id + ".js"));
for (const fileName of fs.readdirSync(topicsDir)) {
    if (fileName.endsWith(".js") && !generatedTopicFiles.has(fileName)) {
        fs.unlinkSync(path.join(topicsDir, fileName));
    }
}
for (const topic of topics) {
    const moduleFile = path.join(topicsDir, topic.id + ".js");
    fs.writeFileSync(moduleFile, "export default " + JSON.stringify(topic, null, 2) + ";\n", "utf8");
}

const manifestTopics = topics.map(({ html, demos, ...metadata }) => ({
    ...metadata,
    module: "./content/topics/" + metadata.id + ".js"
}));
fs.writeFileSync(manifestFile, JSON.stringify({ schemaVersion: 1, topics: manifestTopics }, null, 2) + "\n", "utf8");
console.log("Generated " + topics.length + " documentation topic modules and manifest.");
