export default {
  "name": "SelectionManager",
  "kind": "class",
  "type": "SelectionManager",
  "description": "Manages keyboard, pointer, and range-based grid selection state.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/SelectionManager",
  "source": "src/components/datagrid/SelectionManager.ts",
  "members": [
    {
      "name": "mode",
      "type": "SelectionMode",
      "description": "Current selection rules, applied to pointer, keyboard and programmatic edits.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "setMode",
      "type": "(mode: SelectionMode) => void",
      "description": "Changes the rules and normalizes existing ranges without moving the active cell.\nSwitching to single-row retains the active row; switching to multiple-rows\nexpands each rectangle to whole rows. Cell mode also permits row-header ranges.",
      "tags": [
        {
          "name": "example",
          "text": "manager.setMode(\"single-row\");"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "mode",
          "type": "SelectionMode",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(mode: SelectionMode) => void"
    },
    {
      "name": "selectSingleCell",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Sets a single range, clearing all existing ranges.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => void"
    },
    {
      "name": "selectSingleRow",
      "type": "(rowIndex: number) => void",
      "description": "Replaces all ranges with the specified whole row and sets its first cell active.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number) => void"
    },
    {
      "name": "addRowRange",
      "type": "(rowIndex: number) => void",
      "description": "Adds a whole-row range; single-row mode replaces the previous selection instead.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number) => void"
    },
    {
      "name": "extendRowSelection",
      "type": "(rowIndex: number) => void",
      "description": "Extends the last whole-row range; single-row mode selects the destination row only.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number) => void"
    },
    {
      "name": "addRange",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Appends a new disjoint range (Ctrl / Cmd + Click).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => void"
    },
    {
      "name": "extendSelection",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Extends the focus edge of the current (last added) range (Shift + Click / Drag).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => void"
    },
    {
      "name": "setActiveCell",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Moves ONLY the activeCell inside existing selection ranges (e.g., Tab / Enter navigation).\r\nDoes not alter anchor or focus boundaries of any range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => void"
    },
    {
      "name": "navigateTo",
      "type": "(rowIndex: number, colIndex: number, extend: boolean) => void",
      "description": "Applies a completed keyboard destination, optionally extending the current range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "extend",
          "type": "boolean",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number, extend: boolean) => void"
    },
    {
      "name": "handleCellClick",
      "type": "(rowIndex: number, colIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void",
      "description": "Handles MouseDown or Click events on a cell.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "event",
          "type": "{ shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void"
    },
    {
      "name": "handleRowHeaderClick",
      "type": "(rowIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void",
      "description": "Applies row-header selection, honoring Shift extension, Ctrl/Cmd addition and selection mode.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "event",
          "type": "{ shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void"
    },
    {
      "name": "handleCellMouseEnter",
      "type": "(rowIndex: number, colIndex: number, isMouseDown: boolean) => void",
      "description": "Handles MouseMove events when dragging to extend the selection range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "isMouseDown",
          "type": "boolean",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number, isMouseDown: boolean) => void"
    },
    {
      "name": "handleKeyDown",
      "type": "(event: KeyboardEvent, ctx: GridContext, beforeNavigate?: (current: SelectionCell, target: SelectionCell) => SelectionCell | null) => boolean",
      "description": "Handles keyboard navigation (arrows, PageUp/PageDown, Home/End, Tab, Enter).\nReturns true if the key event was handled by selection.\r\nbeforeNavigate receives detached snapshots before any live mutation;\nreturn null to cancel, or different coordinates to redirect. Redirects\nretain an existing containing range, otherwise select the destination.",
      "tags": [
        {
          "name": "example",
          "text": "manager.handleKeyDown(event, context, (current, target) => target.colIndex === 0 ? null : target);"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "event",
          "type": "KeyboardEvent",
          "optional": false,
          "description": ""
        },
        {
          "name": "ctx",
          "type": "GridContext",
          "optional": false,
          "description": ""
        },
        {
          "name": "beforeNavigate",
          "type": "((current: SelectionCell, target: SelectionCell) => SelectionCell | null) | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(event: KeyboardEvent, ctx: GridContext, beforeNavigate?: (current: SelectionCell, target: SelectionCell) => SelectionCell | null) => boolean"
    },
    {
      "name": "isActive",
      "type": "(rowIndex: number, colIndex: number) => boolean",
      "description": "Checks if a cell is the single active focus cell receiving keyboard input & editing.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => boolean"
    },
    {
      "name": "isSelected",
      "type": "(rowIndex: number, colIndex: number) => boolean",
      "description": "2D hit test checking if a cell at (rowIndex, colIndex) falls inside ANY active range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => boolean"
    },
    {
      "name": "getSelectionState",
      "type": "(rowIndex: number, colIndex: number, ctx?: GridContext) => CellSelectionState",
      "description": "2D hit test that also reports which selection-box sides the cell sits on.\r\nA selected cell is marked with every edge it touches (top/right/bottom/left),\r\nso thin selections (single row/column/single cell) still get a full border.\r\n`ctx` is required to resolve the full column span of whole-row ranges.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "ctx",
          "type": "GridContext | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "CellSelectionState",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number, ctx?: GridContext) => CellSelectionState"
    },
    {
      "name": "getActiveCell",
      "type": "() => SelectionCell | null",
      "description": "Returns the single active cell receiving keyboard focus and editing.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [],
      "returns": {
        "type": "SelectionCell | null",
        "description": ""
      },
      "kind": "method",
      "signature": "() => SelectionCell | null"
    },
    {
      "name": "getRanges",
      "type": "() => SelectionRange[]",
      "description": "Returns all currently active selection ranges.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [],
      "returns": {
        "type": "SelectionRange[]",
        "description": ""
      },
      "kind": "method",
      "signature": "() => SelectionRange[]"
    },
    {
      "name": "isWholeRowSelected",
      "type": "(rowIndex: number) => boolean",
      "description": "Returns whether any whole-row range includes this zero-based visible row.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number) => boolean"
    },
    {
      "name": "clear",
      "type": "() => void",
      "description": "Clears all current ranges and active cell states.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
