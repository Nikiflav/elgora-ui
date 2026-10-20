export default {
  "name": "ComponentOptions",
  "kind": "type",
  "type": "any",
  "description": "Configuration for a Component instance, including DOM and lifecycle props.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Core",
  "path": "/api-reference/ComponentOptions",
  "source": "src/core/Component.ts",
  "definition": "{\n  /** Native root element tag. Defaults to div. */\r\n  tag?: string\r\n  /** Caller-defined identity available to component hosts. */\r\n  key?: any\r\n  /** Utility-style names applied to the root element through the shared class patcher. */\r\n  ui?: UiStyle | UiStyle[]\r\n\r\n  /** Initial children to append to the component's root element. */\r\n  children?: ComponentChild\r\n} & ComponentLifecycleProps & DOMProps"
};
