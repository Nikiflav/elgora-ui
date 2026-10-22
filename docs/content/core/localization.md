---
id: localization
title: Localization
group: fundamentals
path: /fundamentals/localization
order: 70
description: Inherited regional settings, an optional global context and stable editor locales.
toc: true
api:
  - Localization
  - LocaleOptions
  - LocalizationOptions
keywords:
  - locale
  - localization
  - regional settings
  - global locale
---

# Localization

Use `locale` to control regional presentation and to supply a consistent context
to editors and their pickers. Use an application-local `Localization` instance,
or the optional `Localization.default` singleton for convenient global settings.

This first step provides **locale inheritance**, not a translation system. Built-in
commands, validation messages and labels such as Today remain unchanged. Currency,
timezones, the calendar's first weekday and input-acceptance rules are not inferred
from the locale. Tolerant, locale-aware parsing will be a separate step.

## Priority and inheritance

| Consumer | Resolution order |
| --- | --- |
| Grid cell and its editor | Column `locale` → grid `locale` → grid `localization` or `Localization.default` → runtime locale |
| Standalone editor | Editor `locale` → editor `localization` or `Localization.default` → runtime locale |
| Standalone DatePicker | DatePicker `locale` → calendar `localization` or `Localization.default` → runtime locale |
| Editor's DatePicker, TimePicker or lookup grid | Resolved editor locale; lookup result columns may override their own locale |

Unset options stay unset. The grid does not write its inherited locale into
column definitions or its options. `undefined` restores inheritance; an empty
string is not an inheritance marker. Locales use BCP 47 identifiers such as
`bg-BG`, `en-US` and `de-DE`. A context canonicalizes identifiers and rejects
malformed identifiers without changing its previous value.

## Global or application-local settings

```ts
import { Localization, DataGrid } from "elgora-ui";

Localization.default.setLocale("bg-BG");

const grid = new DataGrid({
    data: rows,
    columns: [
        { name: "amount", dataType: "number", displayFormat: "N2" },
        { name: "internationalAmount", dataType: "number", displayFormat: "N2", locale: "en-US" }
    ]
});
// amount inherits bg-BG; internationalAmount always uses en-US.
```

Independent applications or sections can share a context without changing the
singleton or affecting one another:

```ts
const localization = new Localization({ locale: "de-DE" });
const grid = new DataGrid({ localization, data: rows, columns });
const calendar = new DatePicker({ localization });

localization.setLocale("bg-BG");  // Updates inheriting grid presentation and calendar labels.
grid.setOptions({ locale: "en-US" }); // Explicit override; context changes no longer affect this grid.
grid.setOptions({ locale: undefined }); // Reattach to the same application context.
localization.setLocale(undefined); // Reset this context to the runtime locale.
```

Contexts emit their new locale through `changed`. Subscribers receive changes,
not an initial notification. Read `.locale` for the current setting. The grid
and DatePicker own their subscriptions and unsubscribe on disposal. Replacing a
grid's context via `setOptions({ localization: anotherContext })` detaches the old
subscription. Callers own contexts and should not dispose a context's shared
`changed` event while other components use it.

## Try regional presentation

Change the application locale below. Amount, Date and the standalone calendar
inherit it; USD stays en-US. Double-click a grid cell to edit it. No translation
or new text-parsing behavior is enabled by this demo.

<live-demo id="localization" mode="preview" height="430px" src="localization.md.ts"></live-demo>

## Grid editor context

The grid passes the resolved locale to `createFieldEditor` for both normal
editing and clipboard paste. The adapter resolves the column override once,
then passes the same string to built-in editors and to the custom factory's
`FieldEditorContext.locale`. Row-bound `resolveText`, `validate`, lookup and
editable `formatValue` callbacks receive that snapshot too.

Custom factories must forward it to their editor:

```ts
const column = {
    name: "deliveryDate",
    dataType: "date",
    createEditor: context => new DateEditor({
        value: context.value,
        locale: context.locale,
        dateFormat: "d",
        onCommit: context.onCommit
    })
};
```

An editor captures its locale at **creation** and retains it for its lifetime.
For grid editors this is one editing session: changing global, application or
grid locale does not replace the active editor, rewrite its input or change its
interpretation halfway through editing. The next editor receives the new locale.
Standalone editors follow the same lifetime rule; recreate one to adopt a new
locale. Their nested pickers use the captured locale, including popovers first
opened after a context change.

## Display, data and input stay separate

Inherited locale controls built-in `displayFormat` presentation for grid data,
group summaries and totals. Changes do not reload the source, alter group keys,
discard selection/expansion, cancel pending rows or replace invalid cell inputs.
Auto columns are remeasured for the new labels. Custom `getText`/lookup labels
remain application-owned and are not automatically reloaded; refresh their data
when their language-dependent labels change.

`locale` replaces the earlier field property `displayLocale`; no compatibility
alias is retained. The grid overview now sets its locale once, at grid level.

Stored values and existing parsers remain unchanged. NumberEditor still accepts
its existing decimal-dot/comma input, DateEditor keeps its configured `dateFormat`
(including locale-dependent `d`), and TimeEditor retains `HH:mm[:ss]`. Locale does
not automatically enable grouped/currency input or localized checkbox words.
Explicit `resolveText`, `parse`, `format` and `formatValue` callbacks retain their
existing precedence. A currency suffix such as `C2€` remains literal, regardless
of the locale. Standalone NumberFormatter/DateFormatter continue accepting their
own explicit locale arguments; pass `localization.locale` when needed.

See [Numbers, dates and formatting](?!=/data/formatting) for display patterns and
explicit converters.
