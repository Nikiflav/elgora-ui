---
id: calendar
title: Calendar
group: components
path: /components/calendar
order: 47
description: A standalone date-only calendar with month/year navigation and keyboard support.
---

# Calendar

Calendar is a standalone date picker, suitable for a form, panel or editor popup.
It uses the standard UI styles, inherits theme colors and does not depend on a
data source or perform any save operation.

The view is described with keyed `v()` nodes. Dates, weeks and toolbar controls
retain their DOM identity when patched. Initial rendering is immediate; subsequent
changes use the Elgora UI scheduler and are batched on the next animation frame.
State and selection notifications update immediately, before that visual patch.
Explicit keyboard navigation focuses its target after patching; ordinary updates
do not replace retained buttons or restore focus unnecessarily.

## Pick a date

The selected date uses primary color; today's date has a subtle border. Muted
dates belong to adjacent months and remain selectable unless excluded by bounds.
Change the locale or first weekday, and try the optional booking-date restriction.

<live-demo id="calendar" height="465px"></live-demo>

## Date-only values

```ts
const calendar = new Calendar({
    value: "2026-10-13",
    locale: "en-GB",
    firstDayOfWeek: 1,
    onSelect: date => { form.deliveryDate = date; }
});
calendar.mount(container);
```

Dates use strict `YYYY-MM-DD` strings, or `null` for no selection. Invalid dates
such as `2026-02-29` are rejected rather than normalized. A date is not a timestamp:
it is not converted to UTC or shifted by a time zone. UTC-based arithmetic is used
internally only to calculate calendar days and format their labels consistently.

`value` is the selected date. Keyboard focus and the displayed `month` (`YYYY-MM`)
are independent: browsing never selects a date. `setValue(date)` loads a date
silently; `showMonth(date)` browses without changing selection. `setValue(null)`
clears selection and displays the current day, clamped to the allowed range.

```ts
calendar.setValue("2026-11-02"); // No selection callback.
calendar.showMonth("2026-12-01"); // Browse only.
calendar.selected.subscribe(date => console.log("User selected", date));
```

Only explicit user choices invoke `onSelect` and the `selected` observable event.
Choosing an already selected date still emits a selection notification. A host
such as a date editor decides whether that choice should be validated or saved.

## Navigation

- Header arrows browse previous/next months.
- Click the month title to choose among twelve months.
- Click the year title to choose among twelve years; arrows browse year blocks.
- Left/Right move one day; Up/Down move one week.
- Home/End move to the first/last day of the configured week.
- PageUp/PageDown move a month, clamping to the last valid day when necessary.
- Shift+PageUp/PageDown move a year, including leap-day handling.
- Enter or Space select the focused day.
- Escape returns from month/year choices to the day view.

Today selects the current day and emits `selected` and `onSelect`, even when that
date is already selected. It is disabled when today lies outside the inclusive
min/max bounds; no substitute date is selected. The default day is
read from the browser's local clock. Set `today` to supply an application date
or make a demonstration reproducible.

## Bounds and locale

```ts
const delivery = new Calendar({
    min: "2026-10-01",
    max: "2026-11-30",
    locale: "bg-BG",
    firstDayOfWeek: 1
});
```

Bounds are inclusive and apply to pointer selection, keyboard navigation and
external values. Entire months/years outside the range are disabled. Assigning a
value outside the range throws an error; browsing with `showMonth()` is clamped.
Supported years are 0001 through 9999.

Locale controls month names, weekday names and accessible full-date labels.
The first weekday is explicit: 0 = Sunday through 6 = Saturday, defaulting to
Monday. Calendar includes a six-week grid, one keyboard tab stop for days,
selection semantics and accessible labels for each date.

## API reference

[Calendar](?!=/api-reference/Calendar), [CalendarOptions](?!=/api-reference/CalendarOptions).
