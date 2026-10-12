import * as monaco from "monaco-editor/editor/editor.api.js";
import * as typescript from "monaco-editor/languages/features/typescript/register.js";
import "monaco-editor/editor/contrib/suggest/browser/suggestController.js";
import "monaco-editor/editor/contrib/hover/browser/hoverContribution.js";
import "monaco-editor/features/parameterHints/register.js";
import "monaco-editor/languages/definitions/javascript/register.js";
import "monaco-editor/languages/definitions/typescript/register.js";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import TypeScriptWorker from "monaco-editor/language/typescript/ts.worker.js?worker";

(self as unknown as { MonacoEnvironment: { getWorker(id: string, label: string): Worker } }).MonacoEnvironment = {
    getWorker(_id: string, label: string) {
        return label === "typescript" || label === "javascript"
            ? new TypeScriptWorker() : new EditorWorker();
    }
};

let initialized: Promise<void> | undefined;
let nextModel = 0;

async function initialize(): Promise<void> {
    const defaults = typescript.javascriptDefaults;
    defaults.setCompilerOptions({
        target: typescript.ScriptTarget.ES2020,
        module: typescript.ModuleKind.ESNext,
        moduleResolution: typescript.ModuleResolutionKind.NodeJs,
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: false
    });
    // Demo snippets are function bodies: completion is useful, top-level return/await diagnostics are not.
    defaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
    const response = await fetch(new URL("./content/editor-types.json", document.baseURI));
    if (!response.ok) throw new Error("Failed to load ElgoraUI editor declarations.");
    const data = await response.json() as { modules: Record<string, string> };
    for (const [uri, source] of Object.entries(data.modules)) defaults.addExtraLib(source, uri);
}

/** A model and editor owned together by one live example. */
export interface DemoEditor {
    getValue(): string;
    setValue(source: string): void;
    focus(): void;
    dispose(): void;
}

/** Called only after Edit code; the module, workers and declarations are shared by all examples. */
export async function createDemoEditor(host: HTMLElement, source: string): Promise<DemoEditor> {
    initialized ??= initialize().catch(error => { initialized = undefined; throw error; });
    await initialized;
    const model = monaco.editor.createModel(source, "javascript",
        monaco.Uri.parse("file:///examples/demo-" + ++nextModel + ".js"));
    const theme = () => document.documentElement.dataset.theme === "dark" ? "vs-dark" : "vs";
    const editor = monaco.editor.create(host, {
        model, theme: theme(), automaticLayout: true, minimap: { enabled: false },
        fontSize: 13, fontFamily: "Geist Mono, monospace", scrollBeyondLastLine: false,
        wordWrap: "on", lineNumbers: "on", folding: false, overviewRulerLanes: 0,
        renderLineHighlight: "none", padding: { top: 12, bottom: 12 },
        ariaLabel: "Editable JavaScript example",
        unicodeHighlight: { ambiguousCharacters: false }
    });
    const observer = new MutationObserver(() => monaco.editor.setTheme(theme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return {
        getValue: () => model.getValue(),
        setValue: value => model.setValue(value),
        focus: () => editor.focus(),
        dispose: () => { observer.disconnect(); editor.dispose(); model.dispose(); }
    };
}
