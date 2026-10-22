---
id: data-overview
title: Overview — choosing a model
path: /data/overview
group: data
order: 10
description: Choose an array, remote source or DataSet, and separate fields, input and persistence.
---

# Choose a data model

The data layer can be used without DataGrid. All three models can feed a grid, a form or an application-owned view.

## A small local list

Use [ArrayDataSource](?!=/data/data-source/array) around existing objects. It queries and mutates the supplied array, preserves object identity and emits change notifications. It does not provide batch saving or undo history. Use mutation methods, or explicitly invalidate caches after external changes.

## Backend-owned data

Implement the [DataSource contract](?!=/data/data-source/overview) when the backend owns filtering, sorting, paging and acceptance. Start with the [custom remote source example](?!=/data/data-source/remote). Only loadData is required; advertise mutation and history capabilities only when implemented.

## A local editing workspace

Use [DataSet](?!=/data/dataset) for tracked DataRows, related tables, transactional business rules and undo. Tables implement DataSource, so views consume them directly. New-row insertion is local; saving and accepting changes are separate commands.

## Keep responsibilities separate

- [Fields](?!=/data/fields) define value access, presentation, conversion and lookup metadata.
- [Editors](?!=/components/value-editors) manage input, validation and an external acceptance callback.
- [Sources](?!=/data/data-source/overview) query and mutate working data.
- [DataGrid](?!=/components/datagrid/overview) owns visual navigation, selection, editing and retained invalid input.

Start with the simplest model that fits. A grid does not require a DataSet, and adding one later does not require a different grid query protocol.
