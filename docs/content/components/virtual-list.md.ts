import { VirtualList } from "../../../src/components/virtual-list/VirtualList";
import { e } from "../../../src/core/e";

export default function demo(): void {
  const host = e("div", {
    ui: ["elg", "w-100"],
    style: { height: "420px", minHeight: "420px" }
  });
  document.body.append(host);

  const rowCount = 100000;
  const data = Array.from({ length: rowCount }, (_, index) => ({
    id: index,
    name: "Row " + index,
    value: Math.random()
  }));

  const virtualList = new VirtualList({
    data: {
      getAt(index) {
        return data[index];
      },
      count() {
        return data.length;
      }
    },
    renderRow: ({ rowElement, data: row, index }) => {
      rowElement.style.padding = "10px";
      rowElement.innerText = row.name;
      rowElement.style.background = index % 2 === 0 ? "#ede" : "#fefede";
      rowElement.style.height = row.value * 300 + 30 + "px";
    }
  });

  virtualList.mount(host);
}
