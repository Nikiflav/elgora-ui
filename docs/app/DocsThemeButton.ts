import { cbutton } from "../../src/core/c";

/** Reflects document theme changes, including those made by another page's control. */
export function createDocsThemeButton() {
    const button = cbutton({ type: "button", ui: ["elg", "btn", "neutral"], ariaLabel: "Toggle theme" });
    const theme = button.observable(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    button.bindProperty("textContent", theme, value => value === "dark" ? "☀ Light" : "☾ Dark");
    button.listen(button.dom, "click", () => {
        if (document.documentElement.dataset.theme === "dark") delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = "dark";
        sync();
    });
    function sync() { theme.Value = document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    button.addCleanup(() => observer.disconnect());
    return button;
}
