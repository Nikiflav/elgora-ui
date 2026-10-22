---
id: time-editors
title: Time and DateTime
group: components
parent: editors
path: /components/time-editors
order: 19
description: Edit local time and date-time values with strict parsing and asynchronous confirmation.
api:
  - TimeEditor
  - TimeEditorOptions
  - DateTimeEditor
  - DateTimeEditorOptions
  - TimeFormatter
---

# Time and DateTime editors

`TimeEditor` and `DateTimeEditor` use the same value, validation and asynchronous
confirmation lifecycle as the other [Value editors](?!=/components/value-editors).
They do not convert values to a timezone or create a JavaScript `Date` object.

Both editors include a button for mouse and touch input. The picker uses one
vertical list of time slots, every 15 minutes by default. Set `minuteStep` to
`5`, `10`, `30` or another divisor of 60 when a different precision is needed.
When the value is empty, `defaultTime` controls the initially focused slot and
defaults to `10:00`.

<live-demo id="time-editors" height="560px" src="time-editors.md.ts"></live-demo>

## TimeEditor

`TimeEditor` stores a 24-hour value as `HH:mm` by default. Use `HH:mm:ss` when
seconds are significant. Empty input resolves to `null`.

```ts
const start = new TimeEditor({
    value: "09:30",
    label: "Start time",
    onCommit: async value => { await saveStartTime(value); }
});

await start.resolveText("14:05"); // "14:05"
```

The parser rejects invalid clock values such as `24:00` or `12:60`. `timeFormat`
controls the accepted layout and is limited to `HH:mm` and `HH:mm:ss`.

## DateTimeEditor

`DateTimeEditor` stores a local date-time without timezone information. Its
canonical value is `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`; the input uses a
space between the date and time for readability.

Its picker displays the calendar and time slots side by side. Keyboard focus
starts in the calendar and continues to the time list with `Tab`; `ArrowUp`
and `ArrowDown` move between time slots. If the date-time has no time yet,
`defaultTime` supplies the time used after selecting a date.

```ts
const meeting = new DateTimeEditor({
    value: "2026-10-14T09:30",
    label: "Meeting",
    dateFormat: "dd.MM.yyyy",
    timeFormat: "HH:mm",
    onCommit: async value => { await saveMeeting(value); }
});

await meeting.resolveText("14.10.2026 14:05"); // "2026-10-14T14:05"
```

The date part follows `DateFormatter`; the time part follows `TimeFormatter`.
Invalid dates, invalid clock values and ambiguous input are rejected before
validation or `onCommit` runs.

## Confirmation and validation

Both editors accept the common `validate`, `onCommit`, `commit()` and `cancel()`
options. A failed validation or save leaves the typed value available for
correction and retry.

`DateEditor`, `TimeEditor`, `DateTimeEditor` and `LookupEditor` share the
[PopoverEditor](?!=/api-reference/PopoverEditor) base class. `open()` and `close()` control picker visibility;
closing neither accepts nor discards the draft. A picker choice closes the panel
immediately and starts confirmation independently. Errors appear on the editor
without reopening the panel. Escape cancels the draft and returns to the input.

Use `resolveText()` for conversion only. It does not change the editor value,
invoke business validation or call the save callback.

## API reference

See the API references for [TimeEditor](?!=/api-reference/TimeEditor),
[DateTimeEditor](?!=/api-reference/DateTimeEditor) and
[TimeFormatter](?!=/api-reference/TimeFormatter).
