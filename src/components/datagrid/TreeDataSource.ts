import { DataFilter } from "../../data/filter";
import { OrderByToken } from "./DataColumn";
import { DataResult, DataSource } from "./DataSource";
import { GridRowsProvider } from "./GridRow";

export interface TreeDataSource<TRow> {

    loadChildren(args: {
        parentKey: any | null;
        skip?: number;
        top?: number;
        filter?: DataFilter;
        orderBy?: OrderByToken[];
        signal?: AbortSignal;
    }): Promise<DataResult<TRow>>;

    hasChildren(row: TRow): boolean | Promise<boolean>;
}

