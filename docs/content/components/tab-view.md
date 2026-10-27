---
id: tab-view
title: TabView
group: components
parent: navigation
path: /components/tab-view
order: 25
description: Compact accessible tabs with persistent panels and keyboard navigation.
api:
  - TabView
  - TabViewOptions
  - TabViewItem
---

# TabView

Compact tabs separate related tool panels. The active tab shares its panel's
background, while inactive tabs use a muted surface and thin separators.
Both light and dark themes use the standard theme colors.

<live-demo id="tab-view" height="200px" src="tab-view.md.ts"></live-demo>

## Selection and content

Provide `items` with stable `id`, `text`, optional `content` and `disabled`.
`selectedId` sets the initial enabled tab. `select(id)` activates a tab;
`selectionChanged` reports its ID. Hidden panels remain mounted, retaining
draft inputs and component state. Content can be DOM nodes or Components.
`getPanel(id)` returns a persistent panel, and `setTabText(id, text)` updates
translated labels without replacing buttons.

## Keyboard navigation

Tab enters the active tab. Left/Right arrows activate neighboring enabled tabs
with wrapping; Home/End activate the first/last enabled tab. Disabled tabs are
skipped. Panels expose accessible tab/tabpanel relationships. Supply `label`
to name the tab list.
