---
id: date-editor
title: Date
group: components
parent: editors
path: /components/date-editor
order: 51
description: Date-only text editing with a calendar popup and asynchronous confirmation.
---

# Date editor

DateEditor combines a text input with the standalone [Calendar](?!=/components/calendar).
It uses the same validation and asynchronous acceptance contract as other
[Value editors](?!=/components/value-editors), with no dependency on data sources.

## Delivery and booking dates

Type a date and press Enter, or use the calendar button. Delivery uses ISO text;
booking uses `dd.MM.yyyy`, while both keep ISO values. The booking editor
restricts dates to October–November 2026 and rejects weekends. Enable the simulated
save failure to see how a selected date remains available for correction or retry.
Empty text resolves to `null`; the booking example adds a required-field validator.

<live-demo id="date-editor" height="550px"></live-demo>

## Configure an editor

```ts
const deliveryDate = new DateEditor({
    value: "2026-10-14",
    label: "Delivery date",
    locale: "bg-BG",
    firstDayOfWeek: 1,
    min: "2026-10-01",
    max: "2026-11-30",
    onCommit: async value => { await updateDeliveryDate(value); }
});
deliveryDate.mount(container);
```

The value is a strict date-only `YYYY-MM-DD` string or `null`. No timezone is
added and no timestamp conversion is performed. `locale` affects Calendar labels
and the standard `dateFormat: "d"`; explicit patterns are independent of locale.
`min` and `max` are inclusive and apply
to typed values, calendar choices, external resolution and `setValue()`.

## Input, picker and focus

Enter confirms text; Escape restores the last confirmed value. Leaving the
compound editor also confirms by default; set `commitOnBlur: false` to defer it.
Moving focus into Calendar does not confirm pending input.

`openOnFocus: true` opens and focuses the calendar when the input receives focus.
Arrow keys navigate dates and Enter chooses the focused date. The default is
`false`, shared with LookupEditor; lookup keeps focus in its search input instead.
Returning to the input after choosing a date or pressing Escape does not reopen it.
Press Escape to return to direct text editing. The booking example enables this option.

The inset calendar button or Alt+Down opens Calendar and focuses the selected day.
The button does not add a Tab stop: Tab reaches the input directly. Arrow keys inside the text input
remain native caret operations. Opening the picker browses the typed date when
valid, without saving it; invalid text still permits choosing a replacement.
Calendar navigation does not change the editor value. Choosing a day or Today
validates and confirms it, then closes only on success. During asynchronous
acceptance, the input, trigger and picker are unavailable for another edit.

Escape in month/year choices first returns to days. Escape from the day view
closes the picker, restores confirmed text and returns focus to the input.
Ordinary outside dismissal closes the panel without discarding pending text.
A failed validation or save keeps the draft and error in the compact validation indicator; correct the value, retry
`commit()`, or call `cancel()`.

## Resolve and format text

Set `dateFormat` to use the same pattern for display and parsing:

```ts
const booking = new DateEditor({
    value: "2026-10-14",
    dateFormat: "dd.MM.yyyy"
});
// Input: 14.10.2026; value: "2026-10-14"
const value = await booking.resolveText("20.10.2026"); // "2026-10-20"
```

Supported custom tokens are `d`/`dd` (day), `M`/`MM` (month) and `yyyy`
(four-digit year). Each field must appear exactly once with non-alphanumeric
separators between fields. `dd` and `MM` require two input digits; `d` and `M`
accept one or two. Separators must match exactly; surrounding input whitespace
is ignored. Empty editor input means `null`.

The single-letter standard format `"d"` uses the locale's short-date layout:

```ts
new DateEditor({ value: "2026-10-14", dateFormat: "d", locale: "en-US" });
// 10/14/2026
new DateEditor({ value: "2026-10-14", dateFormat: "d", locale: "en-GB" });
// 14/10/2026
```

The default is `"yyyy-MM-dd"`. This is a .NET-inspired subset, not full .NET
compatibility: month names, two-digit years, time tokens, quoted literals and
other standard formats are not supported yet. Unsupported patterns fail at
construction, even when custom callbacks are supplied. Dates remain Gregorian
with Latin digits, independently of the locale's default calendar.

The standalone [DateFormatter](?!=/api-reference/DateFormatter) implements
[ValueFormatter](?!=/api-reference/ValueFormatter) without UI or saving dependencies:

```ts
const formatter = new DateFormatter("dd.MM.yyyy");
formatter.format("2026-10-14"); // "14.10.2026"
formatter.parse("14.10.2026");  // "2026-10-14"
// parse("") throws; nullable/empty handling belongs to the editor.
```

Unlike lossy numeric display formats, the supported date formats preserve the
complete date. Invalid calendar dates are rejected rather than normalized.

```ts
const date = await deliveryDate.resolveText("2026-10-20");
const empty = await deliveryDate.resolveText(""); // null
// Conversion only: neither the editor nor a data source has been updated.
```

The default conversion trims whitespace, maps blank input to `null`, and rejects
invalid dates such as `2026-02-29`, ambiguous formats or timestamps. Business
`validate` and `onCommit` are not invoked by `resolveText()`.

Use a paired `resolveText`/`format` (or `parse`/`format`) for another input format.
An explicit `format` overrides dateFormat display. `resolveText`, then `parse`,
override dateFormat parsing; the other direction continues using dateFormat.
Keep custom converters paired consistently so calendar choices can be parsed too.
Custom conversion may be asynchronous, but must return canonical ISO dates or
`null`; it cannot bypass calendar bounds.

```ts
const localized = new DateEditor({
    value: "2026-10-14",
    resolveText: text => {
        if (!text.trim()) return null;
        const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
        if (!match) throw new Error("Failed to resolve date. Use DD.MM.YYYY.");
        return `${match[3]}-${match[2]}-${match[1]}`;
    },
    format: value => value ? value.split("-").reverse().join(".") : ""
});
```

The input and calendar trigger retain their DOM identity. The trigger uses keyed
VNodes and frame-batched rendering, while Calendar owns and patches its own view.

## API reference

[DateEditor](?!=/api-reference/DateEditor),
[DateEditorOptions](?!=/api-reference/DateEditorOptions),
[TextEditor](?!=/api-reference/TextEditor), [Calendar](?!=/api-reference/Calendar).
