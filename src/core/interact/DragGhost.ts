import { e } from "../e";

export interface DragGhost {
    moveTo(dx: number, dy: number): void;
    remove(): void;
}

/** Floating clone of the dragged item that follows the pointer via a CSS transform. Fixed-positioned and appended to <body>, so it never depends on (or mutates) whatever host element the drag originated from. */
export function createDragGhost(label: string, anchorRect: DOMRect, className?: string, size?: "content"): DragGhost {
    const contentSized = size === "content";

    const el = e("div", {
        class: className,
        style: {
            position: "fixed",
            top: anchorRect.top + "px",
            left: anchorRect.left + "px",
            width: contentSized ? "max-content" : anchorRect.width + "px",
            height: contentSized ? "auto" : anchorRect.height + "px",
            zIndex: "10000",
            pointerEvents: "none",
            overflow: "hidden",
            boxSizing: "border-box"
        }
    }, label);

    document.body.appendChild(el);

    return {
        moveTo(dx, dy) {
            el.style.transform = `translate(${dx}px, ${dy}px)`;
        },
        remove() {
            el.remove();
        }
    };
}
