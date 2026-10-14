---
id: lookup-editor
title: Lookup
group: components
parent: editors
path: /components/lookup-editor
order: 50
description: Search and pick values using a resizable virtualized multi-column popup.
---

# Lookup editor

`LookupEditor<TValue, TItem>` stores a value (for example a customer ID) while
displaying the selected item's name. It shares validation and asynchronous
acceptance with [Value editors](?!=/components/value-editors).

## Customer picker

Click the input or start typing to open the results. Search by customer name or
country. Try `Customer 001` for a unique match and `Customer` for an ambiguous one.
The simulated remote source has 500 items and loads pages on demand. Drag the
bottom-right grip to resize the popup; reopening retains its dimensions.

<live-demo id="lookup-editor" height="510px"></live-demo>

## Configure value, items and paging

```ts
const customer = new LookupEditor<number, Customer>({
    value: order.customerId,
    label: "Customer",
    columns: [
        { name: "name", caption: "Customer", width: 240 },
        { name: "country", caption: "Country", width: 140 }
    ],
    loadItems: async ({ search, skip, top, abortSignal }) => {
        return api.findCustomers({ search, skip, top, signal: abortSignal });
        // { items: Customer[], totalCount: number }
    },
    getItemValue: item => item.id,
    getItemText: item => item.name,
    getValueText: async id => (await api.getCustomer(id)).name,
    onCommit: async id => { await updateOrderCustomer(id); }
});
customer.mount(container);
```

`loadItems` receives `search`, `skip`, `top` and an optional `abortSignal`.
`totalCount` must describe all matching items before paging. Honor cancellation
when possible; the editor also ignores obsolete results if the source cannot abort.
Search is debounced by `searchDelay` (150ms by default). `pageSize` defaults to 50.

`getValueText` resolves the initial or externally supplied value independently
of result pages. Label responses cannot overwrite newer values or typed searches.

## Search, choose and cancel

Typing or pasting changes search text, not the stored value. The filtered popup
uses a virtualized DataGrid in `single-row` mode, without grouping, editing,
context menus or summaries. Headers appear when more than one column is configured.
Its columns use `columnWidthMode: "stretch-all"`, filling extra popup width in
proportion to their base widths while preserving horizontal scroll in narrow popups.

The inset arrow button toggles the popup. Alt+Down opens it without selecting a
result or changing the value. The button does not add a Tab stop; Tab reaches the
input directly, and Left/Right retain native caret behavior.

Set `openOnFocus: true` to also show results when the input receives focus, keeping
focus in the input. This option defaults to `false`, as in DateEditor. Clicking or
typing in the lookup input still opens results independently of this option.

Up/Down focus a result row while keeping native focus in the input. The grid
scrolls only when needed to reveal the row, without aligning each row at the top.
Enter accepts
that explicit row; without a focused row it resolves typed text. Clicking a result
also accepts that item. Escape or outside dismissal restores the last accepted
value and text. IME Enter does not confirm.

Validation and `onCommit` run before acceptance. While awaiting them the editor is
busy. The results popup closes after confirmation even when acceptance fails. The
editor keeps the candidate and error available through the validation indicator for a later retry.
The editor does not write to a data source itself.

## Resolve pasted text

```ts
const id = await customer.resolveText("Customer 001");
// Conversion only; the editor and data source have not changed.
```

The default resolver requests up to two items and checks `totalCount`: zero matches
or more than one match throw an error. There is no first-result or exact-text
fallback. A single row in a page is not sufficient when the total count is greater
than one. The host can use this method for tabular paste and separately validate
and save the returned value. A custom shared `resolveText` option may override
conversion when the application has a dedicated resolver endpoint.

## Popup size

Without `popupWidth`, the popup matches the input's width, with a minimum of
200 CSS pixels where the viewport permits. Automatic width is measured each time
the popup opens. An explicit `popupWidth` overrides this behavior; after a manual
resize, the chosen size is retained on reopening instead of matching the input.
`popupHeight` defaults to 300 CSS pixels. All widths are constrained to the viewport.
`resizable` defaults to true. The reusable [ResizeHandle](?!=/api-reference/ResizeHandle) constrains
the size to the viewport, with minimum dimensions of 200×140 where space permits.
Size is retained only for the lifetime of this editor, not saved globally.

## API reference

[LookupEditor](?!=/api-reference/LookupEditor),
[LookupEditorOptions](?!=/api-reference/LookupEditorOptions),
[LookupQuery](?!=/api-reference/LookupQuery),
[LookupResult](?!=/api-reference/LookupResult),
[ResizeHandle](?!=/api-reference/ResizeHandle).
