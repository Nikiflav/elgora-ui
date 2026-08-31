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
  "definition": "{\n  tag?: string\r\n  key?: any\r\n  ui?: UiStyle | UiStyle[]\r\n\r\n  children?: ComponentChild\r\n} & ComponentLifecycleProps & DOMProps"
};
