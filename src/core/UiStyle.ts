// ======================================================
// ElgoraUI Utility Styles (typed)
// ======================================================

export type UiStyle =
  // ------------------
  // Display
  // ------------------
  | "d-none"
  | "d-block"
  | "d-inline"
  | "d-inline-block"
  | "d-flex"
  | "d-inline-flex"
  | "d-grid"

  // ------------------
  // Flex direction
  // ------------------
  | "flex-row"
  | "flex-row-reverse"
  | "flex-col"
  | "flex-col-reverse"

  // ------------------
  // Flex wrap
  // ------------------
  | "flex-wrap"
  | "flex-nowrap"
  | "flex-wrap-reverse"

  // ------------------
  // Justify
  // ------------------
  | "justify-start"
  | "justify-center"
  | "justify-end"
  | "justify-between"
  | "justify-around"
  | "justify-evenly"

  // ------------------
  // Align items
  // ------------------
  | "items-start"
  | "items-center"
  | "items-end"
  | "items-stretch"
  | "items-baseline"

  // ------------------
  // Align self
  // ------------------
  | "self-auto"
  | "self-start"
  | "self-center"
  | "self-end"
  | "self-stretch"

  // ------------------
  // Gap
  // ------------------
  | "gap-0" | "gap-1" | "gap-2" | "gap-3" | "gap-4" | "gap-5"

  // ------------------
  // Flex sizing
  // ------------------
  | "flex-1"
  | "flex-auto"
  | "flex-initial"
  | "flex-none"

  // Grow / Shrink
  | "grow-0" | "grow-1"
  | "shrink-0" | "shrink-1"

  // Min constraints (IMPORTANT)
  | "min-w-0"
  | "min-h-0"

  // ------------------
  // Margin
  // ------------------
  | "m-0" | "m-1" | "m-2" | "m-3" | "m-4" | "m-5" | "m-auto"
  | "mx-0" | "mx-1" | "mx-2" | "mx-3" | "mx-4" | "mx-5" | "mx-auto"
  | "my-0" | "my-1" | "my-2" | "my-3" | "my-4" | "my-5" | "my-auto"
  | "mt-0" | "mt-1" | "mt-2" | "mt-3" | "mt-4" | "mt-5" | "mt-auto"
  | "mb-0" | "mb-1" | "mb-2" | "mb-3" | "mb-4" | "mb-5" | "mb-auto"
  | "ms-0" | "ms-1" | "ms-2" | "ms-3" | "ms-4" | "ms-5" | "ms-auto"
  | "me-0" | "me-1" | "me-2" | "me-3" | "me-4" | "me-5" | "me-auto"

  // ------------------
  // Padding
  // ------------------
  | "p-0" | "p-1" | "p-2" | "p-3" | "p-4" | "p-5"
  | "px-0" | "px-1" | "px-2" | "px-3" | "px-4" | "px-5"
  | "py-0" | "py-1" | "py-2" | "py-3" | "py-4" | "py-5"
  | "pt-0" | "pt-1" | "pt-2" | "pt-3" | "pt-4" | "pt-5"
  | "pb-0" | "pb-1" | "pb-2" | "pb-3" | "pb-4" | "pb-5"
  | "ps-0" | "ps-1" | "ps-2" | "ps-3" | "ps-4" | "ps-5"
  | "pe-0" | "pe-1" | "pe-2" | "pe-3" | "pe-4" | "pe-5"

  // ------------------
  // Size
  // ------------------
  | "w-100" | "w-auto"
  | "h-100" | "h-auto"

  // ------------------
  // Overflow
  // ------------------
  | "overflow-auto"
  | "overflow-hidden"
  | "overflow-scroll"
  | "overflow-x-auto"
  | "overflow-y-auto"

  // ------------------
  // Position
  // ------------------
  | "position-relative"
  | "position-absolute"
  | "position-fixed"
  | "top-0" | "bottom-0" | "start-0" | "end-0"

  // ------------------
  // Text
  // ------------------
  | "text-start"
  | "text-center"
  | "text-end"
  | "text-wrap"
  | "text-nowrap"

  // ------------------
  // Border
  // ------------------
  | "border"
  | "border-0"
  | "border-top"
  | "border-bottom"
  | "border-start"
  | "border-end"

  // Border style
  | "border-solid"
  | "border-dashed"
  | "border-dotted"
  | "border-none"

  // Border width
  | "border-1"
  | "border-2"
  | "border-3"

  // ------------------
  // Radius
  // ------------------
  | "rounded-0"
  | "rounded-1"
  | "rounded-2"
  | "rounded-3"
  | "rounded-4"
  | "rounded-pill"
  | "rounded-circle"

  // ------------------
  // Colors (CSS class mirror)
  // ------------------
  // ======================================================
  // BASE ELEMENT 
  // ======================================================
  | "elg"

  // ======================================================
  // SURFACES
  // ======================================================
  | "page"
  | "surface"
  | "surface-2"
  | "surface-3"

  // ======================================================
  // SEMANTIC COLORS
  // ======================================================
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral"

  | "text-primary"
  | "text-success"
  | "text-warning"
  | "text-danger"
  | "text-neutral"

  // ======================================================
  // STATE SLOT 1 (PERSISTENT)
  // ======================================================
  | "selected"

  // ======================================================
  // STATE SLOT 2 (SEMANTIC / CONTEXT)
  // ======================================================
  | "active"

  // ======================================================
  // STATE SLOT 3 (INTERACTION)
  // ======================================================
  | "hover"
  | "focus"

  // NOTE:
  // active:active is pseudo-class usage, not a class,
  // so it is NOT included separately.

  // ======================================================
  // BORDER
  // ======================================================
  | "border"
  | "border-strong"

  // ======================================================
  // BG ALPHA UTILITIES
  // ======================================================
  | "bg-a-05"
  | "bg-a-10"
  | "bg-a-25"
  | "bg-a-50"
  | "bg-a-75"
  | "bg-a-100"

  // ======================================================
  // Font Size
  // ======================================================
  | "fs-50"
  | "fs-80"
  | "fs-100"
  | "fs-120"
  | "fs-150"
  | "fs-200"

  // ======================================================
  // Font Weight
  // ======================================================
  | "fw-100"
  | "fw-200"
  | "fw-300"
  | "fw-400"
  | "fw-500"
  | "fw-600"
  | "fw-700"
  | "fw-800"

  // ======================================================
  // Components
  // ======================================================
  | "btn"
  | "box"

  | "user-select-none"
  ;