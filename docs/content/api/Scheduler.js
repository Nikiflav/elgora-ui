export default {
  "name": "Scheduler",
  "kind": "class",
  "type": "Scheduler",
  "description": "Frame-batched task scheduler that deduplicates the same task reference.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Core",
  "path": "/api-reference/Scheduler",
  "source": "src/core/ElgoraUI.ts",
  "members": [
    {
      "name": "schedule",
      "type": "(task: RenderTask) => void",
      "description": "Schedule a task.\r\nSame function reference is automatically deduped.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/core/ElgoraUI.ts",
      "parameters": [
        {
          "name": "task",
          "type": "RenderTask",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(task: RenderTask) => void"
    }
  ]
};
