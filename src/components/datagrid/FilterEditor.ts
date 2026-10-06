import { Component, ComponentOptions } from "../../core/Component";
import { e } from "../../core/e";
import type { UiStyle } from "../../core/UiStyle";
import { DataColumnUtils } from "./DataColumn";
import type { DataColumn, DataType } from "./DataColumn";
import type { DataFilter, FilterSelector } from "../../data/filter";
import { PopupMenu, type MenuItem } from "../popup/PopupMenu";

export type FilterEditorColumn<TRow = any> = Pick<DataColumn<TRow>, "name" | "caption" | "dataType" | "editorType">;
export type FilterEditorOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "contains" | "notcontains" | "startswith" | "endswith";

export interface FilterEditorOptions<TRow = any> extends Omit<ComponentOptions, "children" | "tag"> {
    columns: FilterEditorColumn<TRow>[];
    filter?: DataFilter;
    onApply?: (filter: DataFilter | undefined, editor: FilterEditor<TRow>) => void;
    onCancel?: (editor: FilterEditor<TRow>) => void;
}

type ConditionNode = {
    kind: "condition";
    field: string;
    selector?: FilterSelector;
    operator: FilterEditorOperator;
    value: any;
};

type GroupNode = {
    kind: "group";
    operator: "and" | "or";
    children: FilterNode[];
};

type FilterNode = ConditionNode | GroupNode;

const operators: FilterEditorOperator[] = [
    "=", "<>", ">", ">=", "<", "<=", "contains", "notcontains", "startswith", "endswith"
];

function isOperator(value: any): value is FilterEditorOperator {
    return operators.includes(value);
}

function isBinaryFilter(value: any): boolean {
    return Array.isArray(value)
        && value.length === 3
        && (typeof value[0] === "string" || (value[0] && typeof value[0] === "object"))
        && isOperator(value[1]);
}

function selectorField(selector: FilterSelector): string {
    return typeof selector === "string" ? selector : selector.field;
}

function fromFilterNode(filter: DataFilter | undefined): FilterNode | undefined {
    if (!filter || !Array.isArray(filter) || filter.length === 0) return undefined;

    if (isBinaryFilter(filter)) {
        const selector = filter[0] as FilterSelector;
        return {
            kind: "condition",
            field: selectorField(selector),
            selector,
            operator: filter[1] as FilterEditorOperator,
            value: filter[2]
        };
    }

    const explicitOperator = filter[0] === "and" || filter[0] === "or" ? filter[0] : "and";
    const children = (explicitOperator === "and" || explicitOperator === "or"
        ? filter.slice(1)
        : filter) as DataFilter[];
    const nodes = children
        .map(fromFilterNode)
        .filter((child): child is FilterNode => child !== undefined);

    if (nodes.length === 0) return undefined;
    if (nodes.length === 1) return nodes[0];
    return { kind: "group", operator: explicitOperator, children: nodes };
}

function fromFilter(filter: DataFilter | undefined): GroupNode {
    const node = fromFilterNode(filter);
    if (!node) return { kind: "group", operator: "and", children: [] };
    if (node.kind === "group") return node;
    return { kind: "group", operator: "and", children: [node] };
}

function toFilter(node: FilterNode): DataFilter | undefined {
    if (node.kind === "condition") {
        const selector = node.selector ?? node.field;
        return [selector, node.operator, node.value] as DataFilter;
    }

    const children = node.children.map(toFilter).filter((child): child is DataFilter => child !== undefined);
    if (children.length === 0) return undefined;
    if (children.length === 1) return children[0];
    return [node.operator, ...children] as DataFilter;
}

function expressionValue(value: any): string {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value instanceof Date) return value.toISOString();
    return JSON.stringify(String(value));
}

function toExpression(node: FilterNode): string {
    if (node.kind === "condition")
        return `${node.field} ${node.operator} ${expressionValue(node.value)}`.trim();

    const parts = node.children.map(toExpression).filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0];
    return `(${parts.join(` ${node.operator} `)})`;
}

function defaultOperator(dataType?: DataType): FilterEditorOperator {
    return dataType === "string" || !dataType ? "contains" : "=";
}

/** A reusable builder for structured DataFilter expressions. */
export class FilterEditor<TRow = any> extends Component {
    private readonly columns: FilterEditorColumn<TRow>[];
    private readonly onApplyCallback?: FilterEditorOptions<TRow>["onApply"];
    private readonly onCancelCallback?: FilterEditorOptions<TRow>["onCancel"];
    private initialFilter?: DataFilter;
    private root: GroupNode;
    private rowsElement: HTMLDivElement;
    private previewElement: HTMLPreElement;
    private readonly menu: PopupMenu;

    constructor(options: FilterEditorOptions<TRow>) {
        super({ tag: "div", ui: options.ui ?? ["elg", "box", "p-3"] });
        this.columns = options.columns;
        this.onApplyCallback = options.onApply;
        this.onCancelCallback = options.onCancel;
        this.initialFilter = options.filter;
        this.root = fromFilter(options.filter);
        this.menu = new PopupMenu({ density: "compact" });
        this.addCleanup(() => this.menu.dispose());

        this.rowsElement = e("div", { ui: ["elg", "min-w-0"] });
        this.previewElement = e("pre", { ui: ["elg", "d-none"] });
        this.dom.append(
            this.rowsElement,
            this.previewElement,
            e("div", { ui: ["elg", "d-flex", "justify-end", "items-center", "gap-2", "mt-3"] },
                e("button", {
                    ui: ["elg", "btn", "d-inline-flex", "items-center", "gap-1", "text-muted"],
                    type: "button",
                    ariaLabel: "Clear",
                    title: "Clear",
                    onclick: () => this.clear()
                },
                    e("i", { class: "elg-icon ri-filter-off-line", ui: ["elg"] }),
                    "Clear"
                ),
                e("button", { ui: ["elg", "btn", "primary"], type: "button", onclick: () => this.apply() }, "Apply Filter")
            ),
            this.menu.dom
        );
        this.renderEditor();
    }

    /** Returns the currently edited filter, or undefined when no condition exists. */
    getFilter(): DataFilter | undefined {
        return toFilter(this.root);
    }

    /** Replaces the editor state without invoking the apply callback. */
    setFilter(filter?: DataFilter): void {
        this.root = fromFilter(filter);
        this.renderEditor();
    }

    /** Applies the current draft filter. */
    apply(): void {
        const filter = this.getFilter();
        this.initialFilter = filter;
        this.onApplyCallback?.(filter, this);
    }

    /** Discards the current draft and notifies the cancel callback. */
    cancel(): void {
        this.root = fromFilter(this.initialFilter);
        this.renderEditor();
        this.onCancelCallback?.(this);
    }

    /** Clears the draft and applies an empty filter. */
    clear(): void {
        this.root = { kind: "group", operator: "and", children: [] };
        this.apply();
    }

    private addCondition(group: GroupNode = this.root): void {
        const column = this.columns[0];
        if (!column) return;
        group.children.push({
            kind: "condition",
            field: column.name,
            operator: defaultOperator(DataColumnUtils.getDataType(column)),
            value: ""
        });
        this.renderEditor();
    }

    private addGroup(parent: GroupNode = this.root): void {
        const group: GroupNode = { kind: "group", operator: "and", children: [] };
        parent.children.push(group);
        this.addCondition(group);
    }

    private removeNode(parent: GroupNode, index: number): void {
        parent.children.splice(index, 1);
        this.renderEditor();
    }

    private renderEditor(): void {
        this.rowsElement.replaceChildren();
        this.renderGroup(this.root, this.rowsElement, undefined, 0);
        this.previewElement.textContent = toExpression(this.root) || "(empty)";
    }

    private renderGroup(group: GroupNode, host: HTMLElement, parent: GroupNode | undefined, depth: number): void {
        const groupElement = e("div", {
            ui: depth
                ? ["elg", "border-start", "ps-2", "mb-2"]
                : ["elg", "mb-2"]
        });

        const groupToolbar = e("div", { ui: ["elg", "d-flex", "items-center", "flex-wrap", "gap-1", "mb-1"] },
            this.createChip(group.operator === "and" ? "And" : "Or", ["surface-3", "text-danger"], anchor => this.showMenu(anchor, [
                { key: "and", text: "And", checked: () => group.operator === "and", action: () => {
                    group.operator = "and";
                    this.renderEditor();
                } },
                { key: "or", text: "Or", checked: () => group.operator === "or", action: () => {
                    group.operator = "or";
                    this.renderEditor();
                } }
            ])),
            this.createChip("+", ["text-success", "fs-120"], anchor => this.showMenu(anchor, [
                { key: "condition", text: "Add condition", action: () => this.addCondition(group) },
                { key: "group", text: "Add group", action: () => this.addGroup(group) }
            ])),
            depth ? this.createChip("×", ["text-danger"], () => this.removeNode(parent!, parent!.children.indexOf(group))) : undefined
        );
        groupElement.append(groupToolbar);

        group.children.forEach((child, index) => {
            if (child.kind === "group") {
                this.renderGroup(child, groupElement, group, depth + 1);
                return;
            }
            groupElement.append(this.renderCondition(child, group, index));
        });
        host.append(groupElement);
    }

    private renderCondition(condition: ConditionNode, parent: GroupNode, index: number): HTMLElement {
        const column = this.columns.find(item => item.name === condition.field);
        const row = e("div", { ui: ["elg", "d-flex", "items-center", "flex-wrap", "gap-1", "mb-1", "min-w-0"] });
        row.append(
            this.createChip(column?.caption ?? condition.field, ["surface-3", "text-primary"], anchor => this.showMenu(anchor,
                this.columns.map(item => ({
                    key: item.name,
                    text: item.caption ?? item.name,
                    checked: () => condition.field === item.name,
                    action: () => {
                        condition.field = item.name;
                        condition.selector = undefined;
                        condition.operator = defaultOperator(DataColumnUtils.getDataType(item));
                        this.renderEditor();
                    }
                }))
            )),
            this.createChip(condition.operator, ["surface-3", "text-success"], anchor => this.showMenu(anchor,
                operators.map(value => ({
                    key: value,
                    text: value,
                    checked: () => condition.operator === value,
                    action: () => {
                        condition.operator = value;
                        this.renderEditor();
                    }
                }))
            ))
        );

        const dataType = column ? DataColumnUtils.getDataType(column) : "string";
        const valueInput = e("input", {
            ui: ["elg", "field", "d-inline-block", "px-1", "py-0", "min-w-0"],
            type: dataType === "number" ? "number" : "text",
            value: condition.value == null ? "" : String(condition.value),
            size: Math.max(1, String(condition.value ?? "").length + 1),
            placeholder: column?.caption ?? condition.field
        });
        valueInput.addEventListener("input", () => {
            condition.value = dataType === "number" && valueInput.value !== ""
                ? Number(valueInput.value)
                : valueInput.value;
        });
        row.append(
            valueInput,
            this.createChip("×", ["text-danger"], () => this.removeNode(parent, index))
        );
        return row;
    }

    private createChip(
        text: string,
        styles: UiStyle[],
        onClick: (anchor: HTMLButtonElement) => void
    ): HTMLButtonElement {
        const chip = e("button", {
            ui: ["elg", "btn", "d-inline-block", "px-1", "py-0", ...styles],
            type: "button",
            onclick: (event: MouseEvent) => {
                event.preventDefault();
                onClick(chip);
            }
        }, text);
        return chip;
    }

    private showMenu(anchor: HTMLElement, items: MenuItem[]): void {
        void this.menu.show({
            items,
            anchor,
            placement: "bottom-start",
            gap: 4,
            closeMode: "auto"
        });
    }
}
