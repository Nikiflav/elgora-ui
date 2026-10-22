import { afterEach, describe, expect, it, vi } from "vitest";
import { Localization } from "../../src/localization/Localization";
import { DataViewFieldUtils } from "../../src/data/DataViewField";

const original = Localization.default.locale;
afterEach(() => Localization.default.setLocale(original));

describe("Localization", () => {
    it("canonicalizes identifiers and notifies only on actual changes", () => {
        const context = new Localization({ locale: "en-us" });
        const listener = vi.fn();
        const subscription = context.changed.subscribe(listener);
        expect(context.locale).toBe("en-US");
        context.setLocale("en-US"); expect(listener).not.toHaveBeenCalled();
        context.setLocale("bg-BG"); expect(listener).toHaveBeenCalledExactlyOnceWith("bg-BG");
        expect(() => context.setLocale("not_a_locale")).toThrow();
        expect(context.locale).toBe("bg-BG");
        subscription.dispose(); context.setLocale("de-DE");
        expect(listener).toHaveBeenCalledTimes(1);
    });
    it("resolves explicit, independent and default contexts without modifying options", () => {
        Localization.default.setLocale("bg-BG");
        const localization = new Localization({ locale: "de-DE" });
        expect(Localization.resolveLocale()).toBe("bg-BG");
        expect(Localization.resolveLocale({ localization })).toBe("de-DE");
        const options = { localization, locale: "en-US" };
        expect(Localization.resolveLocale(options)).toBe("en-US");
        expect(options.locale).toBe("en-US");
        expect(Localization.default.locale).toBe("bg-BG");
        localization.setLocale(undefined);
        expect(localization.locale).toBe(new Intl.NumberFormat().resolvedOptions().locale);
    });
    it("resolves field override, host locale and default independently of parsing", async () => {
        const field = { name: "amount", dataType: "number" as const, displayFormat: "N2", locale: undefined as string | undefined };
        const row = { amount: 1234.5 };
        Localization.default.setLocale("bg-BG");
        expect(await DataViewFieldUtils.getText(field, row)).toBe("1\u00a0234,50");
        expect(await DataViewFieldUtils.getText(field, row, "en-US")).toBe("1,234.50");
        field.locale = "de-DE";
        expect(await DataViewFieldUtils.getText(field, row, "en-US")).toBe("1.234,50");
        field.locale = undefined;
        Localization.default.setLocale("en-US");
        expect(await DataViewFieldUtils.getText(field, row)).toBe("1,234.50");
    });
});
