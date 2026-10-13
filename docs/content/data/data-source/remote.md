---
id: datasource-remote
title: Custom remote source
group: data
parent: datasource
path: /data/data-source/remote
order: 3
description: Implement a read-only remote catalog with filtering, paging, cancellation and request errors.
---

# Custom remote source

Implement `loadData()` to connect a view to an API. This example uses a simulated
endpoint with a short delay, so it runs without a server. The source is read-only:
it deliberately supplies no mutation methods.

## Paged product catalog

Enter a product-name filter and press **Enter** or **Search**. Use **Next** and
**Previous** for paging. Rapid searches cancel the previous request; only the latest
response can update the display. **Simulate request error** rejects the next load
until unchecked; **Retry** repeats the current query.

<live-demo id="datasource-remote-catalog" height="390px"></live-demo>

Filtering is performed before count calculation and paging. The count therefore
describes all matches, even though only three products are displayed at once.
The source handles flat filtering and paging only; sorting, grouping and summaries
are intentionally not implemented by this minimal endpoint.

API: [DataSource.loadData](?!=/api-reference/DataSource#loadData),
[QueryArgs](?!=/api-reference/QueryArgs), [DataResult](?!=/api-reference/DataResult).

## Replace the simulated endpoint

Keep the source contract and replace the local request function with your HTTP client:

```ts
const source: DataSource<Product> = {
    async loadData(args) {
        const response = await fetch("/api/products/query", {
            method: "POST",
            signal: args.abortSignal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filter: args.filter,
                skip: args.skip,
                top: args.top,
                requireTotalCount: args.requireTotalCount
            })
        });
        if (!response.ok) throw new Error("Failed to load products. HTTP " + response.status);
        const page = await response.json();
        return {
            args,
            dataItems: page.items,
            totalCount: args.requireTotalCount ? page.totalCount : undefined
        };
    }
};
```

This snippet assumes your endpoint accepts these query fields and returns
`{ items, totalCount }`. Validate and translate them on the server; do not concatenate
client-provided filters into SQL. Add support for sorting, grouping and summaries
when those capabilities are needed by the consumer.

## Cancellation and stale results

```ts
previousController?.abort();
const controller = new AbortController();
previousController = controller;
try {
    const result = await source.loadData({ ...query, abortSignal: controller.signal });
    if (controller !== previousController || controller.signal.aborted) return;
    renderPage(result);
} catch (error) {
    if (controller !== previousController || controller.signal.aborted) return;
    showLoadError(error);
}
```

Cancellation saves unnecessary work when supported by the transport. The identity
check also prevents stale responses from repainting the screen if a source does
not honor cancellation. Clear loading state only for the current request.
Abort the active request when the consumer is destroyed.

API: [QueryArgs.abortSignal](?!=/api-reference/QueryArgs#abortSignal).

## Add editing only when supported

An editable source can add `update`, `delete`, `createNewRow` and `changed`.
The source owns persistence and new-row session behavior. A read-only implementation
does not need to provide placeholder methods that always reject.

See [DataSource overview](?!=/data/data-source/overview) for the editing contract,
or [DataSet](?!=/data/dataset) for collecting local changes before a batch save.
