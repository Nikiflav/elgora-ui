import { ObservableEvent } from "../core/ElgoraUI";
import { enMessages } from "./enMessages";
import { LocalizedError, interpolateMessage, type LocalizedMessages, type MessageArguments, type MessageKey,
    type MessageNamespace, type MessageOverrides, type MessageScope } from "./Messages";

/** Initial regional settings for an independent application context. Register optional dictionaries with addMessages. */
export interface LocalizationOptions {
    /** BCP 47 locale, e.g. bg-BG or en-US. Omission uses the runtime locale. */
    locale?: string;
}

/** Common locale override and optional application-local context. */
export interface LocaleOptions extends LocalizationOptions {
    /** Shared application context. Omission uses Localization.default; an explicit locale takes priority. */
    localization?: Localization;
}

/**
 * Shared regional settings, usable independently or through the optional default singleton.
 * Changing the locale emits synchronously; components own and dispose their subscriptions.
 * UI dictionaries use locale → parent language → English fallback. No currency, timezone or input rules are inferred.
 * @example Localization.default.setLocale("bg-BG");
 * @example const application = new Localization({ locale: "en-US" });
 */
export class Localization {
    /** Default context used only when a component has neither its own locale nor an application context. */
    static readonly default = new Localization();
    /** Emits the new locale after an actual change. Does not emit on subscription. */
    readonly changed = new ObservableEvent<string>();
    /** Emits after messages are registered or overridden, independently of locale changes. */
    readonly messagesChanged = new ObservableEvent<void>();
    private currentLocale: string;
    private readonly dictionaries = new Map<string, MessageOverrides>();
    private readonly fallbackLocales = new Map<string, string[]>();

    /** Creates an independent context; does not change the singleton. Invalid locale identifiers throw. */
    constructor(options: LocalizationOptions = {}) {
        this.currentLocale = this.normalize(options.locale);
    }

    /** Current canonical BCP 47 identifier. */
    get locale(): string { return this.currentLocale; }

    /** Changes the locale, or resets to the runtime locale with undefined. Invalid identifiers leave state unchanged. */
    setLocale(locale: string | undefined): void {
        const next = this.normalize(locale);
        if (next === this.currentLocale) return;
        this.currentLocale = next;
        this.changed.invoke(next);
    }

    /** Resolves an explicit override, then an application context, then the singleton. No DOM lookup or option mutation. */
    static resolveLocale(options: LocaleOptions = {}): string {
        return options.locale ?? (options.localization ?? Localization.default).locale;
    }

    /**
     * Merges a complete or partial dictionary for a BCP 47 language/locale. Later values override earlier ones.
     * Rejects unknown keys, non-string values and changed parameter names before mutating the dictionary.
     */
    addMessages(locale: string, messages: MessageOverrides): void {
        const language = this.normalize(locale).toLowerCase();
        const parameterNames = (text: string) => [...text.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map(match => match[1]);
        for (const [key, value] of Object.entries(messages)) {
            if (!Object.prototype.hasOwnProperty.call(enMessages, key) || typeof value !== "string")
                throw new Error(`Invalid translation key or value: '${key}'.`);
            const expected = [...new Set(parameterNames(enMessages[key as MessageKey]))].sort().join(",");
            if ([...new Set(parameterNames(value))].sort().join(",") !== expected)
                throw new Error(`Translation '${key}' must retain named parameters: ${expected}.`);
        }
        this.dictionaries.set(language, { ...this.dictionaries.get(language), ...messages });
        this.messagesChanged.invoke();
    }

    /** Resolves a typed key using this context's active locale. */
    text<K extends MessageKey>(key: K, ...args: MessageArguments<K>): string {
        return interpolateMessage(this.lookup(this.locale, key), args[0] as Record<string, string | number> | undefined);
    }

    /** Creates a typed functional scope that follows this context's locale. */
    scope<N extends MessageNamespace>(namespace: N): MessageScope<N> {
        return Localization.resolveMessages({ localization: this }).scope(namespace);
    }

    /** Creates a reusable view; explicit snapshotLocale pins editor interpretation without copying dictionaries. */
    static resolveMessages(options: LocaleOptions = {}, snapshotLocale?: string): LocalizedMessages {
        const text = ((key: MessageKey, parameters?: Record<string, string | number>) => {
            const context = options.localization ?? Localization.default;
            return interpolateMessage(context.lookup(snapshotLocale ?? Localization.resolveLocale(options), key), parameters);
        }) as LocalizedMessages["text"];
        return {
            text,
            scope: namespace => ({ text: ((key: string, parameters?: Record<string, string | number>) =>
                (text as (key: MessageKey, parameters?: Record<string, string | number>) => string)(`${namespace}.${key}` as MessageKey, parameters)) } as MessageScope<typeof namespace>),
            describe: error => error instanceof LocalizedError
                ? interpolateMessage((options.localization ?? Localization.default).lookup(snapshotLocale ?? Localization.resolveLocale(options), error.key), error.parameters)
                : error instanceof Error ? error.message : String(error)
        };
    }

    private lookup(locale: string, key: MessageKey): string {
        let candidates = this.fallbackLocales.get(locale);
        if (!candidates) {
            const base = new Intl.Locale(locale).baseName.toLowerCase().split("-");
            candidates = [];
            while (base.length) { candidates.push(base.join("-")); base.pop(); }
            if (!candidates.includes("en")) candidates.push("en");
            this.fallbackLocales.set(locale, candidates);
        }
        for (const language of candidates) {
            const value = this.dictionaries.get(language)?.[key]
                ?? (this === Localization.default ? undefined : Localization.default.dictionaries.get(language)?.[key]);
            if (value !== undefined) return value;
            if (language === "en" && Object.prototype.hasOwnProperty.call(enMessages, key)) return enMessages[key];
        }
        return key;
    }

    private normalize(locale?: string): string {
        return locale === undefined ? new Intl.NumberFormat().resolvedOptions().locale : Intl.getCanonicalLocales(locale)[0];
    }
}
