import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const entryFile = path.join(root, "src", "index.ts");
const outputFile = path.join(root, "docs", "content", "api-docs.json");
const apiDirectory = path.join(root, "docs", "content", "api");
const apiManifestFile = path.join(apiDirectory, "manifest.json");
const guideTopicPaths = new Set();

function collectGuidePaths(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fileName = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            collectGuidePaths(fileName);
            continue;
        }
        if (!entry.name.endsWith(".md")) continue;
        const match = fs.readFileSync(fileName, "utf8").match(/^path:\s*["']?([^\r\n"']+)/m);
        if (match) guideTopicPaths.add(match[1].trim());
    }
}
collectGuidePaths(path.join(root, "docs", "content"));

const program = ts.createProgram([entryFile], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    esModuleInterop: true,
    noEmit: true
});

const checker = program.getTypeChecker();
const entrySource = program.getSourceFile(entryFile);
if (!entrySource) throw new Error(`Could not load ${entryFile}`);

const moduleSymbol = checker.getSymbolAtLocation(entrySource);
if (!moduleSymbol) throw new Error(`Could not resolve exports from ${entryFile}`);

function resolveSymbol(symbol) {
    return symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
}

function declarationOf(symbol) {
    const resolved = resolveSymbol(symbol);
    return resolved.declarations?.[0] || symbol.declarations?.[0];
}

function textOf(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(part => typeof part === "string" ? part : part.text || "").join("");
    return "";
}

function documentationOf(symbol) {
    const resolved = resolveSymbol(symbol);
    return textOf(resolved.getDocumentationComment(checker)).trim();
}

function tagsOf(symbol) {
    const resolved = resolveSymbol(symbol);
    return resolved.getJsDocTags().map(tag => ({
        name: tag.name,
        text: textOf(tag.text).trim()
    }));
}

function sourceOf(node) {
    return path.relative(root, node.getSourceFile().fileName).replaceAll(path.sep, "/");
}

function namespaceOf(source) {
    const parts = source.split("/");
    if (parts[1] === "core") return "Core";
    if (parts[1] === "data") return "Data";
    if (parts[1] === "components" && parts[2]) {
        if (parts[2] === "datagrid" && parts[3] === "DataSource.ts") return "Data";
        const title = parts[2] === "datagrid"
            ? "DataGrid"
            : parts[2].split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
        return `Components.${title}`;
    }
    return "Types";
}

function typeOf(symbol, node) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, node);
    return checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation);
}

function declarationTypeOf(symbol, declaration) {
    if (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration) || ts.isEnumDeclaration(declaration)) {
        const type = checker.getDeclaredTypeOfSymbol(resolveSymbol(symbol));
        return checker.typeToString(type, declaration, ts.TypeFormatFlags.NoTruncation);
    }
    return typeOf(symbol, declaration);
}

function signatureOf(symbol, node) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, node);
    const signatures = [...type.getCallSignatures(), ...type.getConstructSignatures()];
    return signatures.map(signature => checker.signatureToString(
        signature,
        node,
        ts.TypeFormatFlags.NoTruncation,
        ts.SignatureKind.Call
    ));
}

function callableDocs(node) {
    if (!node.parameters) return {};
    const jsdocParams = new Map(ts.getJSDocTags(node)
        .filter(tag => ts.isJSDocParameterTag(tag))
        .map(tag => [
        tag.name.getText(),
        textOf(tag.comment).trim()
        ]));
    const parameters = node.parameters.map(parameter => {
        const name = parameter.name.getText();
        const parameterType = checker.getTypeAtLocation(parameter);
        return {
            name,
            type: checker.typeToString(parameterType, parameter, ts.TypeFormatFlags.NoTruncation),
            optional: Boolean(parameter.questionToken || parameter.initializer),
            defaultValue: parameter.initializer?.getText(),
            description: jsdocParams.get(name) || ""
        };
    });
    const returnTag = ts.getJSDocTags(node).find(tag => ts.isJSDocReturnTag(tag));
    return {
        parameters,
        returns: {
            type: node.type ? node.type.getText() : "void",
            description: textOf(returnTag?.comment).trim()
        }
    };
}

function isPrivateOrProtected(node) {
    return node.modifiers?.some(modifier =>
        modifier.kind === ts.SyntaxKind.PrivateKeyword ||
        modifier.kind === ts.SyntaxKind.ProtectedKeyword
    ) || false;
}

function memberDocs(memberSymbol, memberNode) {
    const tags = tagsOf(memberSymbol);
    return {
        name: memberSymbol.getName(),
        type: typeOf(memberSymbol, memberNode),
        description: documentationOf(memberSymbol),
        tags,
        topics: tags.filter(tag => tag.name === "topic").map(tag => tag.text),
        optional: Boolean(memberSymbol.flags & ts.SymbolFlags.Optional),
        source: sourceOf(memberNode)
        ,...(ts.isMethodDeclaration(memberNode) || ts.isMethodSignature(memberNode)
            ? callableDocs(memberNode)
            : {})
    };
}

function membersOf(declaration) {
    if (!ts.isClassDeclaration(declaration) && !ts.isInterfaceDeclaration(declaration)) return [];

    const result = [];
    for (const member of declaration.members) {
        if (!member.name || isPrivateOrProtected(member)) continue;
        const name = member.name.getText();
        const symbol = checker.getSymbolAtLocation(member.name);
        if (!symbol) continue;
        result.push({
            ...memberDocs(symbol, member),
            kind: memberDocs(symbol, member).tags?.some(tag => tag.name === "event")
                ? "event"
                : ts.isMethodDeclaration(member) || ts.isMethodSignature(member) ? "method" : "property",
            signature: ts.isMethodDeclaration(member) || ts.isMethodSignature(member)
                ? typeOf(symbol, member)
                : undefined
        });
    }
    return result;
}

function declarationKind(declaration) {
    if (ts.isClassDeclaration(declaration)) return "class";
    if (ts.isInterfaceDeclaration(declaration)) return "interface";
    if (ts.isTypeAliasDeclaration(declaration)) return "type";
    if (ts.isFunctionDeclaration(declaration)) return "function";
    if (ts.isVariableDeclaration(declaration)) return "variable";
    if (ts.isEnumDeclaration(declaration)) return "enum";
    return "other";
}

function apiEntry(symbol) {
    const resolved = resolveSymbol(symbol);
    const declaration = declarationOf(symbol);
    if (!declaration) return null;

    const entry = {
        name: symbol.getName(),
        kind: declarationKind(declaration),
        type: declarationTypeOf(resolved, declaration),
        description: documentationOf(resolved),
        tags: tagsOf(resolved),
        topics: tagsOf(resolved).filter(tag => tag.name === "topic").map(tag => tag.text),
        group: declarationKind(declaration) === "type" || declarationKind(declaration) === "interface"
            ? "types"
            : sourceOf(declaration).startsWith("src/components/") ? "components" : "core",
        namespace: namespaceOf(sourceOf(declaration)),
        path: "/api-reference/" + encodeURIComponent(symbol.getName()),
        source: sourceOf(declaration)
        ,...(ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)
            ? callableDocs(declaration)
            : {})
    };

    if (entry.kind === "class" || entry.kind === "interface") {
        entry.members = membersOf(declaration);
    }

    if (entry.kind === "type") {
        entry.definition = declaration.type.getText();
    }

    if (entry.kind === "enum") {
        entry.members = declaration.members.map(member => ({
            name: member.name.getText(),
            description: documentationOf(checker.getSymbolAtLocation(member.name)),
            source: sourceOf(member)
        }));
    }

    return entry;
}

const exports = checker.getExportsOfModule(moduleSymbol)
    .map(apiEntry)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

const invalidTopics = exports.flatMap(entry => (entry.topics || [])
    .filter(topic => !guideTopicPaths.has(topic))
    .map(topic => `${entry.name}: ${topic}`));
if (invalidTopics.length) {
    throw new Error(`API @topic references do not resolve to guide topics:\n${invalidTopics.join("\n")}`);
}

const diagnostics = ts.getPreEmitDiagnostics(program)
    .filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
    .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));

if (diagnostics.length) {
    throw new Error(`API source contains TypeScript errors:\n${diagnostics.join("\n")}`);
}

const output = {
    schemaVersion: 1,
    package: "elgora-ui",
    entry: "src/index.ts",
    generatedBy: "tools/generate-api-docs.mjs",
    exports
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.mkdirSync(apiDirectory, { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
for (const entry of exports) {
    fs.writeFileSync(path.join(apiDirectory, entry.name + ".js"), `export default ${JSON.stringify(entry, null, 2)};\n`, "utf8");
}
fs.writeFileSync(apiManifestFile, `${JSON.stringify({
    schemaVersion: 1,
    entries: exports.map(({ name, kind, group, namespace, path: entryPath, description }) => ({
        name, kind, group, namespace, path: entryPath, description,
        module: "./content/api/" + name + ".js"
    }))
}, null, 2)}\n`, "utf8");
console.log(`Generated ${exports.length} API entries at ${path.relative(root, outputFile)}.`);
