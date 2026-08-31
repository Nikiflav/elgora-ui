import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/components/datagrid/DataSource";

export default function demo(): void {
  const products = ["Laptop", "Monitor", "Keyboard", "Mouse", "Headphones", "Webcam", "Desk Chair", "Desk Lamp"];
  const customers = ["Acme Corp", "Apex Systems", "Atlas Industries", "TechStart", "TechNova", "Global Solutions", "Greenfield Labs", "Innovate Inc", "Ionix", "Digital Dynamics", "Delta Works", "ByteWorks", "Brightside"];
  const regions = ["North", "South", "East", "West"];
  const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
  const data = Array.from({ length: 100_000 }, (_, index) => {
    const quantity = Math.floor(Math.random() * 50) + 1;
    const unitPrice = Math.floor(Math.random() * 900) + 50;
    return {
      id: index + 1,
      orderNumber: `ORD-2024-${String(index + 1).padStart(5, "0")}`,
      product: products[Math.floor(Math.random() * products.length)],
      customer: customers[Math.floor(Math.random() * customers.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      orderDate: new Date(2024, 0, 1 + Math.floor(Math.random() * 365)).toISOString().split("T")[0]
    };
  });
  const grid = new DataGrid({
    data: new ArrayDataSource(data),
    columns: [
      { name: "customer", caption: "Customer", editorType: "text", groupInterval: "firstChar" },
      { name: "id", caption: "ID", editorType: "number", width: 50 },
      { name: "orderNumber", caption: "Order number", editorType: "text" },
      { name: "product", caption: "Product", editorType: "text" },
      { name: "region", caption: "Region", editorType: "text" },
      { name: "status", caption: "Status", editorType: "text" },
      { name: "quantity", caption: "Quantity", editorType: "number" },
      { name: "unitPrice", caption: "Unit price", editorType: "number" },
      { name: "totalAmount", caption: "Total amount", editorType: "number" },
      { name: "orderDate", caption: "Order date", editorType: "date" }
    ],
    groupColumns: ["customer"],
    groupSummary: [
      { field: "quantity", summaryType: "sum" },
      { field: "totalAmount", summaryType: "sum" },
      { field: "unitPrice", summaryType: "average" }
    ],
    stickyGroupRows: true
  });
  grid.dom.classList.add("elg-h-100");
  grid.refresh();
  grid.mount(document.body);
}

