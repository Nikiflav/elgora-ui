---
id: filter-text
title: Text expressions and ranges
group: data
parent: filters
path: /data/filter-text
order: 41
description: Parse filter-row expressions, open ranges and literal operator text, and display readable filters.
api:
  - DataFilterRow
  - DataType
---

# Text expressions and ranges

## Text expressions and ranges

DataFilter itself has no range operator. DataFilterRow translates a text expression
into one or two comparisons, using the field's semantic `dataType`:

```ts
const row = new DataFilterRow([
    { name: "name", caption: "Product", dataType: "string" },
    { name: "price", caption: "Price", dataType: "number" },
    { name: "received", caption: "Received", dataType: "date" }
]);
row.parse("name", "wireless"); // ["name", "contains", "wireless"]
row.parse("name", "=Keyboard"); // ["name", "=", "Keyboard"]
row.parse("price", "20..100"); // AND of >= 20 and <= 100
row.parse("price", "100.."); // ["price", ">=", 100]
row.parse("price", "..50"); // ["price", "<=", 50]
row.parse("received", "01.01.26..31.12.26"); // inclusive Date bounds
```

Text fields default to contains; other types default to equality.
Explicit comparisons include `=`, `!=`, `<`, `<=`, `>` and `>=`.
The text operator `!=` becomes `<>` in DataFilter.
Open-ended numeric and date ranges are inclusive at the supplied endpoint.
Date parsing accepts the formats supported by DataFilterRow, including ISO dates
and day.month.year. The keyword `today` represents the current local date at midnight.
A date-only upper bound is midnight, not the end of that day;
for datetime data use an appropriate exclusive upper bound for the following day.

To search for literal operator-like text, start the input with a backslash.
For example, the input `\=abc` means contains '=abc', whereas `=abc` means equals 'abc'.
In a JavaScript string, escape the backslash:

```ts
row.parse("name", "\\=abc"); // ["name", "contains", "=abc"]
```

API: [DataFilterRow.parse](?!=/api-reference/DataFilterRow#parse),
[DataType](?!=/api-reference/DataType).

## Reverse conversion and readable text

```ts
row.fromFilter(["price", ">=", 100]); // [{ field: "price", text: "100.." }]
row.fromFilter(["name", "contains", "wireless"]); // text: "wireless", no default operator
row.fromFilter(["or", ["price", "<", 30], ["price", ">", 200]]); // false

row.toText(["or", ["name", "contains", "wireless"], ["price", "<", 30]]);
// Product contains 'wireless' or Price < 30
```

fromFilter returns expressions only when the filter can be represented
unambiguously as a collection of field/text pairs. OR, NOT, transformed selectors
and ambiguous conditions return false. A lower/upper bound on the same numeric
or date field is represented as one range expression.
toText can display complex filters even when fromFilter returns false.

API: [fromFilter](?!=/api-reference/DataFilterRow#fromFilter),
[toFilter](?!=/api-reference/DataFilterRow#toFilter),
[toText](?!=/api-reference/DataFilterRow#toText).
