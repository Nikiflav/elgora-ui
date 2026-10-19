---
id: data-filter
title: DataFilter
group: data
path: /data/filter
order: 4
description: Build, edit, evaluate and display structured filters independently of DataGrid.
---

# DataFilter

DataFilter describes a condition or a tree of conditions as arrays. The same
filter can be evaluated locally, supplied to a DataSource or translated by a server.
It contains no grid state and does not depend on a particular editor.

## Product filter playground

Click a preset, then edit its conditions using **FilterEditor** and click
**Apply Filter**. The table and readable summary show the applied filter, not
unapplied editor changes. **Clear** removes the filter.
**Apply Filter** is gray when the filter has not changed and primary-colored while
there are unapplied edits. It remains clickable in either state, allowing the
current filter to be applied again. Returning to the applied values makes it gray.

Try the numeric expression input with `20..100`, `100..` or `..50`.
It replaces the complete filter with a price condition. Expand **Filter JSON and
filter-row expressions** to see the structure and the reverse conversion.
The displayed evalFilter count is calculated separately from the ArrayDataSource
query over the same records.

<live-demo id="data-filter-playground" height="680px"></live-demo>

FilterEditor currently edits binary conditions and explicit AND/OR groups,
including nested groups. It does not provide a NOT node. The NOT preset is
evaluated and displayed without loading it into the visual editor.
Do not assume that every DataFilter structure can be round-tripped through
FilterEditor.

API: [FilterEditor](?!=/api-reference/FilterEditor),
[setFilter](?!=/api-reference/FilterEditor#setFilter),
[FilterEditorOptions.onApply](?!=/api-reference/FilterEditorOptions#onApply),
[DataFilter](?!=/api-reference/DataFilter).

## Conditions and operators

A condition is `[selector, operator, value]`. A selector is normally a field name:

```ts
const available: DataFilter = ["stock", ">", 0];
const affordable: DataFilter = ["price", "<=", 100];
const accessories: DataFilter = ["category", "=", "Accessories"];
const wireless: DataFilter = ["name", "contains", "wireless"];
```

| Operators | Meaning |
| --- | --- |
| =, <> | Equal / not equal |
| >, >=, <, <= | Ordered comparisons |
| contains, notcontains | Text includes / does not include |
| startswith, endswith | Text prefix / suffix |

In local evaluation, text operations are case-insensitive and treat null/undefined
as empty text. Equality with `null` matches null or missing (`undefined`) values,
but not empty text (`""`); `<> null` matches values that are not missing.
Remote SQL adapters translate these conditions to `IS NULL` / `IS NOT NULL`.
Use `null`, not `undefined`, in serialized filter conditions.
Other equality comparisons use strict JavaScript equality; objects and Date
instances are compared by reference. Ordered comparisons use JavaScript comparison semantics.
Supply values of the correct type rather than relying on coercion.

API: [evalFilter](?!=/api-reference/evalFilter).

## AND, OR and NOT

```ts
const all: DataFilter = ["and", ["stock", ">", 0], ["price", "<=", 100]];
const either: DataFilter = ["or", ["category", "=", "Office"], ["price", ">=", 150]];
const nested: DataFilter = ["and", ["stock", ">", 0], either];
const notAvailable: DataFilter = ["!", ["stock", ">", 0]];

// An array of conditions without an explicit operator is implicit AND:
const implicit: DataFilter = [["stock", ">", 0], ["price", "<=", 100]];
```

Use explicit groups when exchanging filters with FilterEditor.
DataFilter/evalFilter also support implicit AND and unary NOT independently of
the editor's supported UI structures.

## Evaluate locally or query a source

```ts
import { ArrayDataSource, evalFilter, type DataFilter } from "elgora-ui";

const filter: DataFilter = ["and", ["stock", ">", 0], ["price", "<=", 100]];
const matches = products.filter(product => evalFilter(product, filter));

const source = new ArrayDataSource(products);
const page = await source.loadData({
    filter, skip: 0, top: 10, requireTotalCount: true
});
```

ArrayDataSource filters before counting and paging. A custom remote source must
implement or translate the query itself; evalFilter is a local evaluator, not a
SQL generator. Empty filters match all rows. Malformed expressions and unsupported
operators throw errors instead of silently matching records.

API: [evalFilter](?!=/api-reference/evalFilter),
[QueryArgs.filter](?!=/api-reference/QueryArgs#filter).
See [DataSource](?!=/data/data-source/overview).

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

## Transformed selectors and transport

A selector can also describe a named transformation:

```ts
const receivedIn2026: DataFilter = [
    { function: "year", field: "received" }, "=", 2026
];
evalFilter(product, receivedIn2026);
```

Built-in local functions include date/grouping transformations such as year and
month. Custom functions can be supplied through FilterFunctionRegistry.
Remote sources must explicitly support the same named transformations.

API: [FilterSelector](?!=/api-reference/FilterSelector),
[FilterFunctionRegistry](?!=/api-reference/FilterFunctionRegistry).

Field names, operators and groups can be serialized as JSON. Date values become
strings during JSON serialization; the receiving application must restore or
interpret their types. In particular, local evaluation of Date bounds requires
Date-compatible values rather than an unprocessed JSON string.

For grid-specific interaction, see [DataGrid filtering](?!=/components/datagrid/filtering).
