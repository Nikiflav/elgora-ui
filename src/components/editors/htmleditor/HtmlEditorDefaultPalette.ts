import type { HtmlEditorPropertyOption } from "./HtmlEditorPropertyProvider";

/** Bootstrap 5 base hues and 100/300/500/700/900 tints, arranged by shade. */
export function htmlEditorDefaultPalette(): HtmlEditorPropertyOption[] {
    const hues = [
        ["blue", "#0d6efd"], ["indigo", "#6610f2"], ["purple", "#6f42c1"], ["pink", "#d63384"],
        ["red", "#dc3545"], ["orange", "#fd7e14"], ["yellow", "#ffc107"], ["green", "#198754"]
    ];
    const mix = (hex: string, target: number, weight: number): string => {
        const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
        return "#" + channels.map(value => Math.round(value * (1 - weight) + target * weight).toString(16).padStart(2, "0")).join("");
    };
    const shades = [{ level: 100, target: 255, weight: 0.8 }, { level: 300, target: 255, weight: 0.4 },
        { level: 500, target: 0, weight: 0 }, { level: 700, target: 0, weight: 0.4 }, { level: 900, target: 0, weight: 0.8 }];
    const colors = shades.flatMap(({ level, target, weight }) => hues.map(([name, base]) => ({
        id: level === 500 ? name : `${name}-${level}`, text: `${name[0].toUpperCase()}${name.slice(1)} ${level}`,
        color: mix(base, target, weight)
    })));
    const neutrals = [["white", "#ffffff"], ["gray-100", "#f8f9fa"], ["gray-300", "#dee2e6"], ["gray-500", "#adb5bd"],
        ["gray-600", "#6c757d"], ["gray-700", "#495057"], ["gray-900", "#212529"], ["black", "#000000"]];
    return [...colors, ...neutrals.map(([id, color]) => ({ id, text: id === "white" ? "White" : id === "black" ? "Black" : `Gray ${id.slice(5)}`, color }))];
}
