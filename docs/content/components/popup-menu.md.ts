import { MenuItem, PopupMenu } from "../../../src/components/popup/PopupMenu";
import { Component } from "../../../src/core/Component";
import { cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
  const component = new Component({
    ui: ["elg", "d-flex", "flex-col", "gap-3"],
    comcreate(com) {
      const anchor = cbutton({ ui: ["elg", "btn", "primary"] }, "Open menu");
      const menu = new PopupMenu();
      const items: MenuItem[] = [
        { key: "edit", text: "Edit", icon: "ri-edit-line", action: () => alert("Edit selected") },
        {
          key: "share",
          text: "Share",
          icon: "ri-share-line",
          subItems: async () => [{ key: "copy", text: "Copy link", icon: "ri-link", action: () => alert("Link copied") }]
        },
        { isDivider: true },
        { key: "delete", text: "Delete", icon: "ri-delete-bin-line", action: () => alert("Delete selected") }
      ];
      anchor.dom.addEventListener("click", () => menu.toggle({ anchor: anchor.dom, items }));
      com.append([anchor, menu]);

      const target = e(
        "div",
        { ui: ["elg", "p-3", "border", "border-dashed", "rounded-1", "user-select-none"] },
        "Right-click for context actions"
      );
      const contextMenu = new PopupMenu();
      target.addEventListener("contextmenu", event => {
        event.preventDefault();
        contextMenu.show({
          point: { x: event.clientX, y: event.clientY },
          items: [{ text: "Refresh", icon: "ri-refresh-line", action: () => alert("Refresh selected") }]
        });
      });
      com.append([target, contextMenu]);
    }
  });
  component.mount(document.body);
}



