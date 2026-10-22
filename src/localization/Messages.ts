import { enMessages } from "./enMessages";

/** All built-in functional message keys, derived from the canonical English catalog. */
export type MessageKey = keyof typeof enMessages;
/** Complete language dictionary. Values are strings, not English string literals. */
export type Messages = { [K in MessageKey]: string };
/** Partial, type-checked application overrides. Unspecified messages use fallback. */
export type MessageOverrides = Partial<Messages>;
type ParametersIn<S extends string> = S extends `${string}{${infer P}}${infer Rest}` ? P | ParametersIn<Rest> : never;
/** Named parameters required by a message; parameter names are inferred from the English template. */
export type MessageParameters<K extends MessageKey> = { [P in ParametersIn<(typeof enMessages)[K]>]: string | number };
/** Typed argument list: messages without parameters do not require an argument object. */
export type MessageArguments<K extends MessageKey> = ParametersIn<(typeof enMessages)[K]> extends never
    ? [] : [parameters: MessageParameters<K>];
/** Functional namespace; independent of physical files and class names. */
export type MessageNamespace = MessageKey extends infer K ? K extends `${infer N}.${string}` ? N : never : never;
/** Local keys available within one functional namespace. */
export type ScopedMessageKey<N extends MessageNamespace> = MessageKey extends infer K
    ? K extends `${N}.${infer Rest}` ? Rest : never : never;
/** Type-safe message access limited to a functional namespace. */
export interface MessageScope<N extends MessageNamespace> {
    /** Resolves a local key and substitutes its required named parameters as plain text. */
    text<K extends ScopedMessageKey<N>>(key: K, ...args: MessageArguments<Extract<`${N}.${K}`, MessageKey>>): string;
}
/** Message view that may follow a component's locale or retain an editor's locale snapshot. */
export interface LocalizedMessages {
    /** Resolves a typed full key. The result is plain text, never HTML. */
    text<K extends MessageKey>(key: K, ...args: MessageArguments<K>): string;
    /** Returns a typed, prefix-limited message view. */
    scope<N extends MessageNamespace>(namespace: N): MessageScope<N>;
    /** Translates library-owned structured errors; application/server errors remain unchanged. */
    describe(error: unknown): string;
}

/** @internal Shared interpolation; callbacks avoid replacement-string expansion of user-supplied dollar signs. */
export function interpolateMessage(template: string, parameters?: Record<string, string | number>): string {
    return template.replace(/\{([a-zA-Z][\w]*)\}/g, (_match, name: string) => {
        if (!parameters || !Object.prototype.hasOwnProperty.call(parameters, name))
            throw new Error(`Missing message parameter '${name}'.`);
        return String(parameters[name]);
    });
}

/**
 * Library-owned message error. Retains a key/parameters instead of reverse-translating English strings.
 * Its default message stays English for non-UI callers; a component's message view localizes it.
 */
export class LocalizedError<K extends MessageKey = MessageKey> extends Error {
    /** Named data for the message; not HTML and never evaluated as code. */
    readonly parameters?: Record<string, string | number>;
    /** Creates a typed error without changing parsing or validation rules. */
    constructor(readonly key: K, ...args: MessageArguments<K>) {
        const parameters = args[0] as Record<string, string | number> | undefined;
        super(interpolateMessage(enMessages[key], parameters));
        this.parameters = parameters;
        this.name = "LocalizedError";
    }
}
