import type { Disposable } from "../../../core/ElgoraUI";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { LocaleOptions } from "../../../localization/Localization";
import type { HtmlEditorSurface } from "./HtmlEditorSurface";
import type { HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";
import { HtmlEditorToolbar } from "./HtmlEditorToolbar";
import { HtmlEditorInspector } from "./HtmlEditorInspector";

export interface HtmlEditorUiCommandControllerOptions extends LocaleOptions {
    toolbar?: boolean;
    inspector?: boolean;
}

/**
 * Owns the command-facing surfaces of HtmlEditor.
 *
 * Toolbar and inspector are separate presentations, but this controller is
 * their single lifecycle and refresh owner. Surface events are subscribed here
 * once and both views are refreshed from the same model/selection generation.
 */
export class HtmlEditorUiCommandController implements Disposable {
    readonly toolbar?: HtmlEditorToolbar;
    readonly inspector?: HtmlEditorInspector;
    private readonly subscriptions: Disposable[] = [];
    private disposed = false;

    constructor(private readonly surface: HtmlEditorSurface, messages: LocalizedMessages,
        registry: HtmlEditorCommandRegistry, options: HtmlEditorUiCommandControllerOptions = {}) {
        if (options.inspector) {
            this.inspector = new HtmlEditorInspector(surface, messages, registry, options);
        }
        if (options.toolbar) {
            this.toolbar = new HtmlEditorToolbar(registry, messages);
            if (this.inspector) this.toolbar.setInspector(this.inspector);
        }
        this.subscriptions.push(surface.documentChanged.subscribe(() => this.refreshDocument()));
        this.subscriptions.push(surface.selectionChanged.subscribe(() => this.refreshSelection()));
        this.subscriptions.push(surface.selectedNodesChanged.subscribe(ids => this.refreshSelectedNodes(ids)));
        this.subscriptions.push(surface.interactionChanged.subscribe(() => this.refreshInteraction()));
    }

    /** Mounts both optional surfaces directly into their intended DOM locations. */
    mountSurfaces(root: HTMLElement, body: HTMLElement): void {
        if (this.toolbar) {
            this.toolbar.mount(root);
            root.insertBefore(this.toolbar.dom, body);
        }
        if (this.inspector) {
            this.inspector.mount(body);
            body.classList.add("elg-html-editor-with-inspector");
        }
        this.refreshDocument();
    }

    /** Releases subscriptions and both optional surfaces. */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.subscriptions.splice(0).forEach(subscription => subscription.dispose());
        this.toolbar?.dispose();
        this.inspector?.dispose();
    }

    private refreshDocument(): void {
        this.inspector?.refreshDocument();
        this.toolbar?.update();
    }

    private refreshSelection(): void {
        this.inspector?.refreshSelection();
        this.toolbar?.update();
    }

    private refreshSelectedNodes(ids: readonly string[]): void {
        this.inspector?.refreshSelectedNodes(ids);
        this.toolbar?.update();
    }

    private refreshInteraction(): void {
        this.inspector?.update();
        this.toolbar?.update();
    }
}
