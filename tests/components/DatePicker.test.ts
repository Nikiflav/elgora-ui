import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "../../src/components/date-picker/DatePicker";
import { ElgoraUI } from "../../src/core/ElgoraUI";
import { Localization } from "../../src/localization/Localization";
import * as publicApi from "../../src/index";

// Behavioral cases render deterministically; frame batching is tested separately below.
beforeEach(() => { vi.spyOn(ElgoraUI.scheduler, "schedule").mockImplementation(task => task()); });

const calendars: DatePicker[] = [];
function create(options: ConstructorParameters<typeof DatePicker>[0] = {}) {
    const calendar = new DatePicker({ today: "2026-10-13", locale: "en-GB", ...options });
    calendars.push(calendar);
    calendar.mount(document.body);
    return calendar;
}
function day(calendar: DatePicker, date: string): HTMLButtonElement {
    return calendar.dom.querySelector<HTMLButtonElement>(`button[data-date='${date}']`)!;
}
function button(calendar: DatePicker, label: string): HTMLButtonElement {
    return calendar.dom.querySelector<HTMLButtonElement>(`button[aria-label='${label}']`)!;
}
function key(calendar: DatePicker, key: string, shiftKey = false): void {
    const focused = calendar.dom.querySelector("button[tabindex='0']")!;
    focused.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }));
}
afterEach(() => { calendars.splice(0).forEach(calendar => calendar.dispose()); document.body.replaceChildren(); vi.restoreAllMocks(); });

describe("DatePicker", () => {
    it("exports DatePicker without a legacy Calendar alias", () => {
        expect(publicApi.DatePicker).toBe(DatePicker);
        expect(publicApi).not.toHaveProperty("Calendar");
    });
    it("updates localized labels with keyed DOM identity and disposes its context subscription", () => {
        const localization = new Localization({ locale: "en-US" });
        const calendar = create({ locale: undefined, localization, value: "2026-10-13" });
        const retained = day(calendar, "2026-10-20"); retained.focus();
        expect(button(calendar, "Choose month").textContent).toBe("October");
        localization.setLocale("bg-BG");
        expect(button(calendar, "Choose month").textContent).toBe("октомври");
        expect(day(calendar, "2026-10-20")).toBe(retained);
        expect(document.activeElement).toBe(retained);
        const render = vi.spyOn(calendar as any, "updateLocale");
        calendar.dispose(); localization.setLocale("de-DE");
        expect(render).not.toHaveBeenCalled();
    });
    it("preserves keyed days, headers and native focus during a same-month patch", () => {
        const calendar = create({ value: "2026-10-13" });
        const retained = day(calendar, "2026-10-20");
        const heading = button(calendar, "Choose month");
        const oldSelected = day(calendar, "2026-10-13");
        retained.focus();
        calendar.setValue("2026-10-21");
        expect(day(calendar, "2026-10-20")).toBe(retained);
        expect(button(calendar, "Choose month")).toBe(heading);
        expect(document.activeElement).toBe(retained);
        expect(oldSelected.parentElement!.getAttribute("aria-selected")).toBe("false");
        expect(oldSelected.classList.contains("elg-primary")).toBe(false);
        expect(oldSelected.style.border).not.toBe("");
        expect(day(calendar, "2026-10-21").classList.contains("elg-primary")).toBe(true);
    });
    it("preserves shared weeks and dates when browsing an adjacent month", () => {
        const calendar = create({ value: "2026-10-13" });
        const retained = day(calendar, "2026-10-28");
        calendar.showMonth("2026-11-01");
        expect(day(calendar, "2026-10-28")).toBe(retained);
        expect(retained.classList.contains("elg-text-muted")).toBe(true);
    });
    it("patches the roving tab stop without replacing a focused day", () => {
        const calendar = create({ value: "2026-10-13" });
        const retained = day(calendar, "2026-10-20");
        retained.focus();
        expect(day(calendar, "2026-10-20")).toBe(retained);
        expect(document.activeElement).toBe(retained);
        expect(retained.tabIndex).toBe(0);
        expect(day(calendar, "2026-10-13").tabIndex).toBe(-1);
    });
    it("coalesces updates on the real scheduler and patches the latest state", async () => {
        vi.restoreAllMocks();
        const schedule = vi.spyOn(ElgoraUI.scheduler, "schedule");
        const calendar = create({ value: "2026-10-13" });
        const retained = day(calendar, "2026-10-20");
        calendar.setValue("2026-10-14");
        calendar.setValue("2026-10-15");
        calendar.setValue("2026-10-20");
        expect(calendar.value).toBe("2026-10-20");
        expect(day(calendar, "2026-10-13").parentElement!.getAttribute("aria-selected")).toBe("true");
        expect(new Set(schedule.mock.calls.map(([task]) => task)).size).toBe(1);
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        expect(day(calendar, "2026-10-20")).toBe(retained);
        expect(retained.parentElement!.getAttribute("aria-selected")).toBe("true");
        expect(day(calendar, "2026-10-13").parentElement!.getAttribute("aria-selected")).toBe("false");
    });
    it("does not rebuild a disposed calendar with a pending render", async () => {
        vi.restoreAllMocks();
        const calendar = create({ value: "2026-10-13" });
        const retained = day(calendar, "2026-10-13");
        calendar.showMonth("2026-11-01");
        calendar.dispose();
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        expect(day(calendar, "2026-10-13")).toBe(retained);
        expect(calendar.dom.isConnected).toBe(false);
    });
    it("shows a six-week month with adjacent dates and a single keyboard tab stop", () => {
        const calendar = create({ value: "2026-10-13" });
        expect(calendar.month).toBe("2026-10");
        expect(calendar.dom.querySelectorAll("button[data-date]")).toHaveLength(42);
        expect(day(calendar, "2026-09-28")).toBeTruthy();
        expect(day(calendar, "2026-11-08")).toBeTruthy();
        expect(calendar.dom.querySelectorAll("button[data-date][tabindex='0']")).toHaveLength(1);
        expect(day(calendar, "2026-10-13").getAttribute("aria-current")).toBe("date");
        expect(day(calendar, "2026-10-13").parentElement!.getAttribute("aria-selected")).toBe("true");
    });
    it("loads values silently and emits selection only on explicit choice", () => {
        const onSelect = vi.fn();
        const calendar = create({ value: "2026-10-13", onSelect });
        const selected = vi.fn();
        calendar.selected.subscribe(selected);
        calendar.setValue("2026-10-20");
        expect(onSelect).not.toHaveBeenCalled();
        day(calendar, "2026-10-21").click();
        expect(calendar.value).toBe("2026-10-21");
        expect(onSelect).toHaveBeenCalledWith("2026-10-21", calendar);
        expect(selected).toHaveBeenCalledWith("2026-10-21");
        expect(document.activeElement).toBe(day(calendar, "2026-10-21"));
    });
    it("selects adjacent-month dates and displays their month", () => {
        const calendar = create({ value: "2026-10-13" });
        day(calendar, "2026-11-01").click();
        expect(calendar.value).toBe("2026-11-01");
        expect(calendar.month).toBe("2026-11");
    });
    it("browses months without changing selection", () => {
        const calendar = create({ value: "2026-12-31" });
        button(calendar, "Next period").click();
        expect(calendar.month).toBe("2027-01");
        expect(calendar.value).toBe("2026-12-31");
        button(calendar, "Previous period").click();
        expect(calendar.month).toBe("2026-12");
    });
    it("honors first weekday and localized month labels", () => {
        const calendar = create({ locale: "bg-BG", firstDayOfWeek: 0, value: "2026-10-13" });
        expect(calendar.dom.querySelector("button[data-date]")!.getAttribute("data-date")).toBe("2026-09-27");
        expect(button(calendar, "Choose month").textContent?.toLowerCase()).toContain("октомври");
    });
    it("enforces inclusive bounds for selection, browsing and external values", () => {
        const calendar = create({ value: "2026-10-15", min: "2026-10-10", max: "2026-10-20" });
        expect(day(calendar, "2026-10-09").disabled).toBe(true);
        expect(day(calendar, "2026-10-10").disabled).toBe(false);
        expect(day(calendar, "2026-10-20").disabled).toBe(false);
        expect(button(calendar, "Next period").disabled).toBe(true);
        expect(button(calendar, "Previous period").disabled).toBe(true);
        expect(() => calendar.setValue("2026-10-21")).toThrow("outside the allowed range");
        calendar.showMonth("2027-01-01");
        expect(calendar.month).toBe("2026-10");
        expect(calendar.value).toBe("2026-10-15");
    });
    it("moves keyboard focus without selecting and crosses month boundaries", () => {
        const calendar = create({ value: "2026-10-31" });
        calendar.focus();
        key(calendar, "ArrowRight");
        expect(calendar.month).toBe("2026-11");
        expect(document.activeElement).toBe(day(calendar, "2026-11-01"));
        expect(calendar.value).toBe("2026-10-31");
        key(calendar, "ArrowDown");
        expect(document.activeElement).toBe(day(calendar, "2026-11-08"));
        key(calendar, "Home");
        expect(document.activeElement).toBe(day(calendar, "2026-11-02"));
        key(calendar, "End");
        expect(document.activeElement).toBe(day(calendar, "2026-11-08"));
    });
    it("accepts the browsed date with Enter after keyboard navigation", () => {
        const onSelect = vi.fn();
        const calendar = create({ value: "2026-10-13", onSelect });
        calendar.focus();
        key(calendar, "ArrowRight");
        expect(calendar.value).toBe("2026-10-13");
        key(calendar, "Enter");
        expect(calendar.value).toBe("2026-10-14");
        expect(onSelect).toHaveBeenCalledExactlyOnceWith("2026-10-14", calendar);
    });
    it("clamps Page navigation to valid month ends including leap days", () => {
        const calendar = create({ value: "2024-01-31" });
        key(calendar, "PageDown");
        expect(document.activeElement).toBe(day(calendar, "2024-02-29"));
        key(calendar, "PageDown", true);
        expect(document.activeElement).toBe(day(calendar, "2025-02-28"));
        key(calendar, "PageUp");
        expect(document.activeElement).toBe(day(calendar, "2025-01-28"));
    });
    it("does not move keyboard focus outside the allowed range", () => {
        const calendar = create({ value: "2026-10-10", min: "2026-10-10", max: "2026-10-20" });
        key(calendar, "ArrowLeft");
        expect(document.activeElement).toBe(day(calendar, "2026-10-10"));
        key(calendar, "PageDown");
        expect(document.activeElement).toBe(day(calendar, "2026-10-20"));
    });
    it("chooses months and years without committing a date", () => {
        const calendar = create({ value: "2026-10-13" });
        button(calendar, "Choose month").click();
        button(calendar, "February").click();
        expect(calendar.month).toBe("2026-02");
        button(calendar, "Choose year").click();
        button(calendar, "2027").click();
        button(calendar, "March").click();
        expect(calendar.month).toBe("2027-03");
        expect(calendar.value).toBe("2026-10-13");
    });
    it("disables month/year choices outside bounds and supports Escape", () => {
        const calendar = create({ value: "2026-10-13", min: "2026-10-10", max: "2027-03-05" });
        button(calendar, "Choose month").click();
        expect(button(calendar, "February").disabled).toBe(true);
        button(calendar, "Next period").click();
        expect(button(calendar, "February").disabled).toBe(false);
        expect(button(calendar, "April").disabled).toBe(true);
        button(calendar, "Choose year").click();
        const focused = calendar.dom.querySelector("button[aria-label='2027']")!;
        focused.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        expect(calendar.dom.querySelector("[role='grid']")).not.toBeNull();
    });
    it("Today selects the application-local date and emits both selection notifications", () => {
        const onSelect = vi.fn();
        const calendar = create({ value: "2025-01-01", onSelect });
        const selected = vi.fn();
        calendar.selected.subscribe(selected);
        button(calendar, "Choose year").click();
        button(calendar, "Select today").click();
        expect(calendar.month).toBe("2026-10");
        expect(calendar.value).toBe("2026-10-13");
        expect(selected).toHaveBeenCalledExactlyOnceWith("2026-10-13");
        expect(onSelect).toHaveBeenCalledExactlyOnceWith("2026-10-13", calendar);
        expect(document.activeElement).toBe(day(calendar, "2026-10-13"));
        button(calendar, "Select today").click();
        expect(selected).toHaveBeenCalledTimes(2);
        calendar.setValue(null);
        expect(calendar.value).toBeNull();
        expect(calendar.dom.querySelector("[aria-selected='true']")).toBeNull();
    });
    it.each([
        { min: "2026-10-14", value: "2026-10-15" },
        { max: "2026-10-12", value: "2026-10-10" }
    ])("disables Today outside the allowed bounds without selecting a substitute", options => {
        const onSelect = vi.fn();
        const calendar = create({ ...options, onSelect });
        const today = button(calendar, "Select today");
        expect(today.disabled).toBe(true);
        today.click();
        expect(calendar.value).toBe(options.value);
        expect(onSelect).not.toHaveBeenCalled();
    });
    it("allows Today on an inclusive min/max boundary", () => {
        const calendar = create({ min: "2026-10-13", max: "2026-10-13" });
        expect(button(calendar, "Select today").disabled).toBe(false);
        button(calendar, "Select today").click();
        expect(calendar.value).toBe("2026-10-13");
    });
    it.each(["2026-02-29", "2024-02-30", "2026-13-01", "2026-00-01", "2026-10-00", "2026-1-1", "0000-01-01", "2026-10-13T00:00:00Z"])(
        "rejects invalid date %s", value => {
            const calendar = create();
            expect(() => calendar.setValue(value)).toThrow("valid YYYY-MM-DD");
        });
    it("validates reversed bounds and first-day options", () => {
        expect(() => create({ min: "2026-10-20", max: "2026-10-10" })).toThrow("Minimum date");
        expect(() => create({ firstDayOfWeek: 7 })).toThrow("firstDayOfWeek");
    });
    it("supports year 1 and 9999 without rolling into invalid years", () => {
        const calendar = create({ value: "0001-01-01" });
        expect(button(calendar, "Previous period").disabled).toBe(true);
        calendar.setValue("9999-12-31");
        expect(button(calendar, "Next period").disabled).toBe(true);
        key(calendar, "ArrowRight");
        expect(calendar.month).toBe("9999-12");
    });
});
