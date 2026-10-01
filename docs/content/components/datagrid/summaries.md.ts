import { e } from "../../../../src/core/e";
import { DataGrid } from "../../../../src/components/datagrid/DataGrid";

export default function demo(): void {
  const rows = [
    { region: "West", product: "Keyboard", total: 356 },
    { region: "East", product: "Monitor", total: 498 },
    { region: "West", product: "Webcam", total: 483 },
    { region: "East", product: "Dock", total: 537 },
    { region: "North", product: "Mouse", total: 118 },
    { region: "North", product: "Keyboard", total: 267 }
  ];
  const columns = [
    { name: "region", caption: "Region", width: 140 },
    { name: "product", caption: "Product", width: 220 },
    { name: "total", caption: "Total", width: 120, textAlign: "end" as const }
  ];

  const sameSummaryGrid = new DataGrid({
    data: rows,
    columns,
    groupColumns: ["region"],
    groupSummary: [{ field: "total", summaryType: "sum" }],
    totalSummary: [{ field: "total", summaryType: "sum" }]
  });
  sameSummaryGrid.dom.style.height = "250px";

  const differentSummaryGrid = new DataGrid({
    data: rows,
    columns,
    groupColumns: ["region"],
    groupSummary: [{ field: "total", summaryType: "sum" }],
    totalSummary: [{ field: "total", summaryType: "avg" }]
  });
  differentSummaryGrid.dom.style.height = "250px";

  const root = e("div",
    e("h3", { ui: ["elg", "mt-0", "mb-1", "fs-110"] }, "Same summary for groups and total"),
    e("p", { ui: ["elg", "mt-0", "mb-2", "text-muted"] }, "Group: sum · Total: sum")
  );
  document.body.appendChild(root);

  sameSummaryGrid.mount(root);
  sameSummaryGrid.refresh();
  root.append(
    e("h3", { ui: ["elg", "mt-4", "mb-1", "fs-110"] }, "Different summaries"),
    e("p", { ui: ["elg", "mt-0", "mb-2", "text-muted"] }, "Group: sum · Total: avg (shown as avg: in the footer)")
  );
  differentSummaryGrid.mount(root);
  differentSummaryGrid.refresh();
}
