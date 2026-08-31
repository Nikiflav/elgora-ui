---
id: virtual-list
title: Virtual List
group: components
path: /components/virtual-list
order: 30
description: Efficiently render very large collections by keeping only the visible rows in the DOM.
toc: true
api:
  - VirtualList
  - VirtualListOptions
  - DataList
  - RenderRowArgs
  - SizeManager
  - VariableSizeManager
  - FixedSizeManager
keywords:
  - virtual list
  - virtualization
  - large collections
  - variable height
---

# Virtual List

`VirtualList` renders only the rows that are visible in the viewport. This keeps
the DOM small even when the underlying collection contains hundreds of
thousands of items.

## Variable-height rows

The demo below renders 100,000 generated rows. Each row has a different height,
while `VirtualList` measures and positions only the visible portion of the
collection.

<live-demo id="virtual-list-overview" height="420px"></live-demo>

The data source provides random access through `getAt()` and the total number
of rows through `count()`. `renderRow()` receives the row element, data, and
visible index so the application can render the row content.

See the [`VirtualList` API reference](?!=/api-reference/VirtualList), including
[`VirtualListOptions`](?!=/api-reference/VirtualListOptions),
[`DataList`](?!=/api-reference/DataList), and [`RenderRowArgs`](?!=/api-reference/RenderRowArgs).
