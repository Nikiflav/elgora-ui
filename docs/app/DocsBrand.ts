import { e } from "../../src/core/e";

/** Shared identity for the landing page and documentation navigation. */
export function createDocsBrand(className = "") {
    return e("a", { href: "?!=/", class: `docs-brand ${className}`, ariaLabel: "Elgora UI home" },
        e("img", { src: new URL("../assets/elgora-mark.svg", import.meta.url).href, width: 32, height: 32, alt: "" }),
        e("span", {}, "Elgora UI"));
}
