// Run: node tools/benchmark-local-data.mjs [rowCount]
// Data-engine microbenchmark, not a browser/UI benchmark. No files are generated.
// TypeScript is transpiled in memory; UI stylesheet imports are ignored in Node.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, filename);
require.extensions[".css"] = () => {};
const { ArrayDataSource } = require(fileURLToPath(new URL("../src/data/ArrayDataSource.ts", import.meta.url)));
const { LocalGroupingDataSource } = require(fileURLToPath(new URL("../src/data/LocalGroupingDataSource.ts", import.meta.url)));
const { DataSet } = require(fileURLToPath(new URL("../src/data/dataset/DataSet.ts", import.meta.url)));

const count = Number(process.argv[2] ?? 100000);
if (!Number.isSafeInteger(count) || count < 1) throw new Error("Row count must be a positive safe integer.");
const rows = Array.from({ length: count }, (_, id) => ({ id, region: "R" + id % 100,
    amount: id * 7919 % 10000, quantity: id % 20 }));
const summaries = [{ field: "amount", summaryType: "sum" }, { field: "amount", summaryType: "avg" },
    { field: "quantity", summaryType: "sum" }];
let reads = 0;
let loads = 0;
const array = new ArrayDataSource(rows, { filterFunctions: {} });
const load = array.loadData.bind(array);
array.loadData = args => { loads++; return load(args); };
const read = (row, field) => { reads++; return row[field]; };
const local = new LocalGroupingDataSource(array, read);
const asyncLocal = new LocalGroupingDataSource(array, async (row, field) => read(row, field));

async function measure(name, action, before) {
    await action(); // warm-up, excluded from measurements
    reads = loads = 0;
    const times = [];
    for (let iteration = 0; iteration < 5; iteration++) {
        before?.();
        const start = performance.now();
        await action();
        times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    console.log(JSON.stringify({ name, medianMs: +times[2].toFixed(3), readsPerRun: reads / 5, loadsPerRun: loads / 5 }));
}

console.log(JSON.stringify({ node: process.version, rows: count, samples: 5 }));
const reset = () => array.invalidateCache();
await measure("sorted page of 50 (cold)", () => local.loadData({ orderby: [["amount", "desc"]], top: 50 }), reset);
await measure("sorted page of 50 (cached)", () => local.loadData({ orderby: [["amount", "desc"]], skip: 50, top: 50 }));
await measure("three total summaries (sync, cold)", () => local.loadData({ top: 50, totalSummary: summaries }), reset);
await measure("three total summaries (sync, cached)", () => local.loadData({ top: 50, totalSummary: summaries }));
await measure("three total summaries (async, cold)", () => asyncLocal.loadData({ top: 50, totalSummary: summaries }), reset);
await measure("100 groups with three summaries (sync, cold)", () => local.loadData({ groupColumn: "region", groupSummary: summaries, top: 50 }), reset);
await measure("same grouped query second page (cached)", () => local.loadData({ groupColumn: "region", groupSummary: summaries, skip: 50, top: 50 }));
await measure("100 groups with three summaries (async, cold)", () => asyncLocal.loadData({ groupColumn: "region", groupSummary: summaries, top: 50 }), reset);
await measure("prepared filter with function registry (cold)", () => array.loadData({
    filter: ["and", ["amount", ">", 1000], ["region", "contains", "R1"]], top: 50
}), reset);

const table = new DataSet().createTable("benchmark", rows);
const tableSource = new LocalGroupingDataSource(table, (row, field) => { reads++; return row.getValue(field); });
const resetTable = () => table.invalidateCache();
await measure("DataTable sorted page (cold)", () => table.loadData({ orderby: [["amount", "desc"]], top: 50 }), resetTable);
await measure("DataTable sorted page (cached)", () => table.loadData({ orderby: [["amount", "desc"]], skip: 50, top: 50 }));
await measure("DataTable three totals (cold)", () => table.loadData({ totalSummary: summaries, top: 50 }), resetTable);
await measure("DataTable three totals (cached)", () => table.loadData({ totalSummary: summaries, top: 50 }));
await measure("DataTable grouped summaries (cold)", () => tableSource.loadData({ groupColumn: "region", groupSummary: summaries, top: 50 }), resetTable);
await measure("DataTable grouped next page (cached)", () => tableSource.loadData({ groupColumn: "region", groupSummary: summaries, skip: 50, top: 50 }));
