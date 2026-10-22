---
id: data-filter
title: DataFilter expressions
group: data
path: /data/filter
order: 40
description: Build, edit, evaluate and display structured filters independently of DataGrid.
parent: filters
sectionRedirects:
  - product-filter-playground|/components/filter-editor#product-filter-playground
  - text-expressions-and-ranges|/data/filter-text#text-expressions-and-ranges
  - reverse-conversion-and-readable-text|/data/filter-text#reverse-conversion-and-readable-text
---

# DataFilter

DataFilter describes a condition or a tree of conditions as arrays. The same
filter can be evaluated locally, supplied to a DataSource or translated by a server.
It contains no grid state and does not depend on a particular editor.

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

## Related topics

- [FilterEditor playground](?!=/components/filter-editor)
- [Text expressions and ranges](?!=/data/filter-text)
