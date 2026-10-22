---
id: date-editor
title: Date
group: components
parent: editors
path: /components/date-editor
order: 18
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

<live-demo id="date-editor" height="550px" src="date-editor.md.ts"></live-demo>

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
updates the input and closes the picker immediately, then starts validation and
confirmation. During asynchronous acceptance, the input and trigger are unavailable
for another edit. A failure appears on the editor without reopening the picker.

Escape in month/year choices first returns to days. Escape from the day view
closes the picker, restores confirmed text and returns focus to the input.
Ordinary outside dismissal closes the panel without discarding pending text.
A failed validation or save keeps the draft and error in the compact validation indicator; correct the value, retry
`commit()`, or call `cancel()`.

## Resolve and format text

Set `dateFormat: "dd.MM.yyyy"` for matching display and parsing; the default is `"yyyy-MM-dd"`. `dateFormat: "d"` uses the locale short-date layout. Values remain canonical `YYYY-MM-DD` strings or null.

See [Dates, times and formatting](?!=/data/formatting) for supported tokens, custom conversion precedence and strict parsing. `resolveText()` converts without validation or saving; calendar bounds still apply.

## API reference

[DateEditor](?!=/api-reference/DateEditor),
[DateEditorOptions](?!=/api-reference/DateEditorOptions),
[TextEditor](?!=/api-reference/TextEditor), [Calendar](?!=/api-reference/Calendar).
