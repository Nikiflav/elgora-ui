import { BrowserRouter } from "../../../src/components/browser-router/BrowserRouter";
import { e } from "../../../src/core/e";

export default function demo(): void {
  const page = (title: string, message: string) => ({
    title,
    description: message,
    dom: e("section", {
      ui: ["elg", "p-3"]
    }, e("h2", title), e("p", message))
  });

  const router = new BrowserRouter([
    {
      path: "/",
      createPage: () => page("Home", "This is the home page.")
    },
    {
      path: "/details",
      createPage: () => page("Details", "This page was rendered by the router.")
    }
  ]);

  const navigation = e("nav", {
    ui: ["elg", "d-flex", "gap-2", "p-2", "border-bottom"]
  },
    e("a", { href: "?!=/", ui: ["elg", "no-underline"] }, "Home"),
    e("a", { href: "?!=/details", ui: ["elg", "no-underline"] }, "Details")
  );

  document.body.append(navigation, router.dom);
}
