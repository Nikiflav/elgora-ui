export interface ApiEntry {
    name: string;
    kind: string;
    type: string;
    description?: string;
    tags?: { name: string; text: string }[];
    topics?: string[];
    group?: "core" | "components" | "types";
    namespace?: string;
    path?: string;
    parameters?: ApiParameter[];
    returns?: ApiReturn;
    members?: ApiMember[];
}

export interface ApiMember {
    name: string;
    kind: "property" | "method" | "event";
    type: string;
    signature?: string;
    description?: string;
    optional?: boolean;
    topics?: string[];
    parameters?: ApiParameter[];
    returns?: ApiReturn;
}

export interface ApiParameter {
    name: string;
    type: string;
    optional?: boolean;
    defaultValue?: string;
    description?: string;
}

export interface ApiReturn {
    type: string;
    description?: string;
}

export interface ApiManifestEntry {
    name: string;
    kind: string;
    group: "core" | "components" | "types";
    namespace: string;
    path: string;
    description?: string;
    module: string;
}

export interface ApiManifest {
    schemaVersion: number;
    entries: ApiManifestEntry[];
}
