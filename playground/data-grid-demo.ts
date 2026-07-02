
import { RouterHandler } from "../src/components/browser-router/BrowserRouter";
import { DataGrid } from "../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../src/components/datagrid/DataSource";

const products = ["Laptop", "Monitor", "Keyboard", "Mouse", "Headphones", "Webcam", "Desk Chair", "Desk Lamp"];
const customers = ["Acme Corp", "TechStart", "Global Solutions", "Innovate Inc", "Digital Dynamics", "ByteWorks"];
const regions = ["North", "South", "East", "West"];
const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];

const data = Array.from({ length: 100_000 }, (_, i) => {
    const product = products[Math.floor(Math.random() * products.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const quantity = Math.floor(Math.random() * 50) + 1;
    const unitPrice = Math.floor(Math.random() * 900) + 50;
    const orderDate = new Date(2024, 0, 1 + Math.floor(Math.random() * 365));

    return {
        id: i + 1,
        orderNumber: `ORD-${2024}-${String(i + 1).padStart(5, "0")}`,
        product,
        customer,
        region,
        status,
        quantity,
        unitPrice,
        totalAmount: quantity * unitPrice,
        orderDate: orderDate.toISOString().split("T")[0]
    };
});

const grid = new DataGrid({
    data: new ArrayDataSource(data),
    columns: [
        { name: "id", editorType: "number", width: 250 },
        { name: "orderNumber", editorType: "text" },
        { name: "product", editorType: "text" },
        { name: "customer", editorType: "text" },
        { name: "region", editorType: "text" },
        { name: "status", editorType: "text" },
        { name: "quantity", editorType: "number", summaryType: "sum" },
        { name: "unitPrice", editorType: "number" },
        { name: "totalAmount", editorType: "number", summaryType: "sum" },
        { name: "orderDate", editorType: "date" }
    ],
    groupColumns: ["customer", "region", "status"]
});

grid.dom.classList.add("elg-h-100");

// Create testing router page

export const dataGridRouterHandler: RouterHandler = {
    path: '/data-grid',
    createPage(urlParams) {
        grid.refresh()
        return {
            title: 'Data Grid',
            description: 'Data Grid component',
            dom: grid.dom
        };
    }
};

