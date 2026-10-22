---
id: data-fields
title: Fields and presentation
group: data
path: /data/fields
order: 20
description: Separate data access, reusable field presentation and grid-column behavior.
---

# Fields and presentation

Field definitions have three layers. Choose the smallest contract needed by the
consumer, and extend it when adding presentation or grid behavior.

| Contract | Responsibility |
| --- | --- |
| DataField | Field name, semantic type, value access and grouping |
| DataViewField | Labels, description, display text, editor, lookup and per-row visibility |
| DataGridColumn | Width, alignment, resize/reorder, menus, cell styles and VNode rendering |

## Data access

A [DataField](?!=/api-reference/DataField) describes values in any row type.
It does not register a field in a DataTable or require a DataSet. Local grouping
and summary engines consume this contract without depending on a UI component.

```ts
import type { DataField } from "elgora-ui";

type OrderLine = { quantity: number; unitPrice: number };
const amount: DataField<OrderLine> = {
    name: "amount",
    dataType: "number",
    getValue: async row => row.quantity * row.unitPrice
};
```

API: [DataField.getValue](?!=/api-reference/DataField#getValue),
[dataType](?!=/api-reference/DataField#dataType),
[DataType](?!=/api-reference/DataType).

Declare `dataType` explicitly for numbers, dates and booleans. Missing types default
to string when a type is required; an editor choice does not determine the type.
Numeric summary evaluation can also recognize actual number values when no type
was declared.

## Reusable presentation

[DataViewField](?!=/api-reference/DataViewField) extends DataField. It describes
how a field can be presented by a form, card, list or grid, without defining a column
width or depending on grid menu types.

```ts
import type { DataViewField } from "elgora-ui";

const amountView: DataViewField<OrderLine> = {
    ...amount,
    caption: "Amount",
    description: "Quantity multiplied by unit price",
    readonly: true,
    displayFormat: "C2€",
    locale: "bg-BG"
};
```

API: [DataViewField.caption](?!=/api-reference/DataViewField#caption),
[getText](?!=/api-reference/DataViewField#getText),
[lookup](?!=/api-reference/DataViewField#lookup),
[createEditor](?!=/api-reference/DataViewField#createEditor).

`dataType` selects the standard editor. `lookup` supplies searchable choices and
optional result columns; `createEditor` provides a custom editor without changing
the semantic type. `resolveText`, `validate`, and `formatValue` describe conversion,
validation, and editable formatting. Hosts pass row-bound callbacks to value-only
editors and save through their data source, never through field setters.
See [Cell editing](?!=/components/datagrid/editing) for interactive examples.

`displayFormat` is display-only: it preserves the raw value and editor precision.
For regular labels the priority is `getText`, lookup, `displayFormat`, then
`formatValue` or string conversion. The grid also applies display formats to
group and total summaries, except counts. See [Numbers, dates and formatting](?!=/data/formatting)
for numeric patterns, literal currency suffixes and locale-aware parsing.

## Grid columns

[DataGridColumn](?!=/api-reference/DataGridColumn) extends DataViewField with grid
layout and interaction. Reuse the common field definition and add grid options:

```ts
import type { DataGridColumn } from "elgora-ui";

const amountColumn: DataGridColumn<OrderLine> = {
    ...amountView,
    width: 120,
    textAlign: "end",
    resizable: true,
    reorderable: true
};
```

API: [DataGridColumn.width](?!=/api-reference/DataGridColumn#width),
[textAlign](?!=/api-reference/DataGridColumn#textAlign),
[renderCell](?!=/api-reference/DataGridColumn#renderCell),
[customCellStyle](?!=/api-reference/DataGridColumn#customCellStyle).

See [Columns and layout](?!=/components/datagrid/columns) and
[Custom cell rendering](?!=/components/datagrid/custom-cell-rendering) for live examples.
