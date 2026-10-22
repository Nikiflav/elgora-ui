---
id: dataset-tables
title: Tables, rows and change tracking
group: data
parent: dataset-group
path: /data/dataset/tables
order: 51
description: Create tables, assign identities, read tracked rows and compare accepted values.
api:
  - DataTable
  - DataRow
  - DataTableOptions
---

# Tables, rows and change tracking

## Create a dataset and tables

Create tables through the dataset so they participate in its save batch and transactions.
Table names must be unique. Initial imported rows are accepted, with state unchanged.
The identity field defaults to id; identities are strings or finite numbers.

```ts
import { DataSet } from "elgora-ui";

const dataset = new DataSet({
    createRowId: table => table.name + "-" + crypto.randomUUID()
});
let lastOrderId = 0;
const orders = dataset.createTable("orders", [
    { id: 1, quantity: 2, price: 10, total: 20 }
], {
    idField: "id",
    createRowId: table => lastOrderId = table.rows.reduce(
        (max, row) => Math.max(max, Number(row.key)), lastOrderId
    ) + 1,
    defaults: () => ({
        quantity: 1,
        price: 0,
        total: 0,
        createdAt: new Date()
    })
});
const totals = dataset.createTable("totals", [{ id: "screen", amount: 20 }]);

dataset.getTable("orders") === orders;
orders.dataSet === dataset;
```

API: [DataSet](?!=/api-reference/DataSet), [createTable()](?!=/api-reference/DataSet#createTable), [getTable()](?!=/api-reference/DataSet#getTable), [DataSetOptions](?!=/api-reference/DataSetOptions), [DataTableOptions](?!=/api-reference/DataTableOptions).

defaults may be an object, a function, or an asynchronous function. The function runs
for every new row. createRowId can also be asynchronous, and a table-level generator
overrides the dataset generator. The generated identity takes precedence over an
identity supplied in defaults.

## Read values and track edits

```ts
const order = orders.getRow(1)!;
const result = await order.setValue("quantity", 5);
if (!result.success) {
    console.error(result.error, result.fieldErrors);
}

order.getValue("quantity");    // 5
order.getOriginal("quantity"); // 2
order.isModified("quantity");  // true
order.toObject();              // new field container; values are not cloned
order.changes();               // { quantity: 5 }
orders.getChanges();           // [{ type: "update", key: 1, data: { quantity: 5 } }]
```

API: [DataRow](?!=/api-reference/DataRow): [setValue()](?!=/api-reference/DataRow#setValue), [getValue()](?!=/api-reference/DataRow#getValue), [getOriginal()](?!=/api-reference/DataRow#getOriginal), [isModified()](?!=/api-reference/DataRow#isModified), [toObject()](?!=/api-reference/DataRow#toObject), [changes()](?!=/api-reference/DataRow#changes); [DataTable.getChanges()](?!=/api-reference/DataTable#getChanges), [MutationResult](?!=/api-reference/MutationResult).

Rows have four persistence states:

| State | Meaning |
| --- | --- |
| unchanged | Accepted data without tracked edits |
| modified | An existing row was edited; transport includes differing fields |
| added | A new row not yet accepted after persistence |
| deleted | A confirmed row marked for removal |

Changing a field back to an equal accepted value removes that field from the update
payload. The row may retain modified state even when getChanges() has no update for it.
Deleting an unsaved added row removes it without creating a server delete request.

## Equality and object-valued fields

The default comparison is `Object.is`. Objects, arrays and dates are stored by reference
and are not cloned. Replace a field value to track a change; modifying the contents
of the same object is not tracked or reversed by undo.

```ts
const locations = dataset.createTable("locations", [], {
    equals: (field, a, b) => {
        if (field !== "position") return Object.is(a, b);
        const left = a as { latitude: number; longitude: number } | undefined;
        const right = b as typeof left;
        return left === right || (!!left && !!right &&
            left.latitude === right.latitude && left.longitude === right.longitude);
    }
});
```

API: [DataSet.createTable()](?!=/api-reference/DataSet#createTable), [DataTableOptions.equals](?!=/api-reference/DataTableOptions#equals).

equals is synchronous and must be side-effect-free, reflexive, symmetric and transitive.
It is used both to detect edits and to compare with accepted values. Equal values do
not replace the existing reference, raise business events or add history.
