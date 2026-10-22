---
id: data-formatting
title: Numbers, dates and formatting
group: data
path: /data/formatting
order: 90
description: Numeric display formats, literal currencies, canonical dates and times, and explicit parsing.
---

# Numbers, dates and formatting

Use formatters outside the UI for consistent display and parsing. DateEditor, TimeEditor and DateTimeEditor keep canonical strings, not JavaScript timestamps. Date-only values have no timezone. These formats are a documented .NET-inspired subset, not full .NET compatibility.

## Numeric formats

[NumberFormatter](?!=/api-reference/NumberFormatter) implements
[ValueFormatter](?!=/api-reference/ValueFormatter) without a UI dependency. Construct
it once and reuse it; each instance retains its Intl formatters. Patterns are
case-sensitive. An optional precision specifies **fraction digits**, from 0 to 20.
`N`, `F`, `P` and currency patterns default to two fraction digits; `G` accepts no
precision and does not impose a fixed number of decimals.

| Pattern | Meaning | Example with `en-US` |
| --- | --- | --- |
| `G` | General, no grouping or forced trailing zeros | `1234.56789` → `1234.56789` |
| `N0` | Grouped, no fraction digits | `1234.56` → `1,235` |
| `N2` or `N` | Grouped, two fraction digits | `1234.5` → `1,234.50` |
| `F2` or `F` | Two fraction digits, no grouping | `1234.5` → `1234.50` |
| `P1` | Percentage, one fraction digit | `0.125` → `12.5%` |
| `P` | Percentage, two fraction digits | `0.125` → `12.50%` |
| `C$` | Grouped amount and literal dollar sign | `1234.5` → `1,234.50 $` |
| `C€` | Grouped amount and literal euro sign | `1234.5` → `1,234.50 €` |
| `CBGN` | Grouped amount and literal currency code | `1234.5` → `1,234.50 BGN` |
| `C0€` | Currency, no fraction digits | `1234.5` → `1,235 €` |
| `C2BGN` | Currency, two fraction digits | `1234.5` → `1,234.50 BGN` |

```ts
import { NumberFormatter } from "elgora-ui";

const money = new NumberFormatter("C2€", "bg-BG");
money.format(1234.5);          // "1 234,50 €"
money.parse("1 234,50 €");    // 1234.5
new NumberFormatter("P1", "en-US").parse("12.5%"); // 0.125
```

### Currency and locale

Currency suffixes are an Elgora UI extension, **not standard .NET currency
syntax**. Use `C`, optional precision, then one or more letters or currency
symbols, without spaces: `C2€`, `C$`, `CBGN`. Bare `C`/`C2` are invalid.
The suffix is literal: `$` does not infer USD, and no exchange conversion occurs.
The suffix always follows the number, separated by a nonbreaking space, even
where a locale would normally put currency before the amount.

Locale controls decimal/group separators, grouping sizes, minus signs and percent
placement. Omit it to use the runtime locale. Digits remain Latin. `G` retains up
to 21 significant digits without scientific notation; it is not .NET's `G`
exponent-selection algorithm. Custom numeric masks, hexadecimal formats,
accounting negatives and quoted literals are not supported.

`format()` requires a finite JavaScript number; it rejects strings, NaN and
infinity. `parse()` accepts the configured locale, with or without digit grouping,
and trims surrounding whitespace. Regular spaces, NBSP and narrow NBSP are
interchangeable where the locale uses space separators. Grouping must be valid;
`F`/`G` do not accept grouped input. Currency/percent affixes must be present.
Empty input, other currencies, exponents, trailing text and malformed numbers
throw. Nullable/empty handling belongs to the editor. Parsing does not require
the configured number of fraction digits.

### Display formats on fields and columns

Set `displayFormat` on a `DataViewField` or `DataGridColumn`, together with an
optional `locale`. This currently supports `dataType: "number"` and
`dataType: "date"` (using DateFormatter patterns). Use `getText` for other types,
including combined datetime labels.

```ts
const columns = [
    { name: "quantity", dataType: "number", displayFormat: "N0", locale: "bg-BG" },
    { name: "unitPrice", dataType: "number", displayFormat: "N2", locale: "bg-BG" },
    { name: "totalAmount", dataType: "number", displayFormat: "C2€", locale: "bg-BG" },
    { name: "orderDate", dataType: "date", displayFormat: "dd.MM.yyyy" }
];
```

Normal cell label precedence is `getText` → `lookup.getValueText` →
`displayFormat` → `formatValue` → string conversion. Null/undefined display as
empty text when formatted. Field formatters are cached per field and recreated
when its pattern, locale or data type changes. The grid resolves locale in this
order: column → grid → the grid's application context or `Localization.default`
→ runtime locale. A locale change repaints built-in formatted labels and summaries
without re-querying data. Explicit column/grid locales remain overrides.
Use `setColumnOptions` to change column metadata. `getText` and lookup labels
remain application-owned; custom callbacks are not automatically rerun when the
locale changes. See [Localization](?!=/fundamentals/localization).

The grid applies the same display format to group and total aggregate values,
without changing raw source results. `count` and `distinct` remain plain counts,
not currency/percent amounts. Custom numeric aggregate results use the field's
format; custom textual results remain text. Summary labels do not call
row-dependent `getText`, lookup resolvers or `formatValue`.

See the [DataGrid overview](?!=/components/datagrid/overview) for grouped integers,
decimal prices and euro totals using the same patterns in data rows and summaries.

### Display is not editing

`displayFormat` never changes the stored value, sort/group keys or aggregate
precision. It does not configure an editor's parser. A value of `1234.56789`
displayed with `N2` is rounded visually, but its numeric editor still receives
the original `1234.56789`. `formatValue` remains the explicit editable-text hook.

If an editor must accept localized numeric input, provide a matching
`resolveText` explicitly. For example, a standalone NumberEditor can use a
formatter for input as well as output:

```ts
const numericInput = new NumberFormatter("N2", "bg-BG");
const editor = new NumberEditor({
    value: 1234.5,
    format: value => value == null ? "" : numericInput.format(value),
    resolveText: text => text.trim() ? numericInput.parse(text) : null
});
```

This explicitly chooses a two-decimal editing representation. Parsing a rounded
label cannot recover the original hidden decimals; avoid lossy editor formats
when full precision must remain editable. Copying a formatted grid label likewise
produces display text: configure a field's `resolveText` if pasted localized or
currency text should be accepted. Numeric formatting uses JavaScript numbers,
not an arbitrary-precision decimal or financial arithmetic engine.

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
const deliveryDate = new DateEditor({ value: null });
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
VNodes and frame-batched rendering, while DatePicker owns and patches its own view.

## Time formats

TimeFormatter formats and parses canonical time strings. See [Time and DateTime](?!=/components/time-editors) for supported patterns, precision and picker behavior. Use the same converter pair for display and input; a localized label is not automatically a reversible input format.

API: [NumberFormatter](?!=/api-reference/NumberFormatter), [TimeFormatter](?!=/api-reference/TimeFormatter), [DateFormatter](?!=/api-reference/DateFormatter), [ValueFormatter](?!=/api-reference/ValueFormatter).
