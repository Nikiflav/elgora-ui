import { TabView, e } from "../../../src/index";

export default function demo(): void {
    new TabView({ label: "Inspector", items: [
        { id: "properties", text: "Properties", content: e("div", {},
            e("p", {}, "Basic element properties"), e("input", { value: "A persistent draft", ariaLabel: "Draft" })) },
        { id: "advanced", text: "Advanced", content: "Classes, attributes and styles" },
        { id: "unavailable", text: "Unavailable", disabled: true }
    ] }).mount(document.body);
}
