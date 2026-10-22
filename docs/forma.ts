import { Scrollbars } from "../src/index";
import { mountForma } from "./examples/forma";

const showcase = mountForma(document.body);
showcase.addCleanup(Scrollbars.install(window, { scrollbarMode: "thin" }));
