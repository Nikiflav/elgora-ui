
export class Utils {

    /** Creates new guid */
    static newid() { // Public Domain/MIT
        var d = new Date().getTime(); //Timestamp
        var d2 = (performance && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxxxxxxyxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16; //random number between 0 and 16
            if (d > 0) { //Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else { //Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    /** Converts blob to base64 string */
    static blobToBase64(blob: Blob) {
        return new Promise<string>((resolve, _) => {
            const reader = new FileReader();
            //@ts-ignore
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }
    /** Tries to convert a plural word to singular */
    static singular(word: string): string {
        return word.replace(/ies$/, "y").replace(/s$/, "");
    }

    /** Checks if an enum value has a flag */
    static hasFlag(num: number, flag: number): boolean {
        return (num & flag) == flag;
    }

    /** Returns a promise resolved after the provided time. */
    public static delay(ms: number, signal?: AbortSignal) {
        return new Promise((resolve, reject) => {
            const id = setTimeout(resolve, ms);

            signal?.addEventListener("abort", () => {
                clearTimeout(id);
                reject(new DOMException("Aborted", "AbortError"));
            });
        });
    }
    /** Compares two objects */
    public static equals(x: any, y: any): boolean {
        const ok = Object.keys, tx = typeof x, ty = typeof y;
        return x && y && tx === 'object' && tx === ty ? (
            ok(x).length === ok(y).length &&
            ok(x).every(key => Utils.equals(x[key], y[key]))
        ) : (x == y);
    }
    /** Gets a value of data member - property path */
    public static getMember(obj: Record<string, any>, path: string): any {
        if (path in obj)
            return obj[path];
        var tokens = path.split('.');
        var o = obj
        for (var i = 0; i < tokens.length; i++) {
            o = o[tokens[i]];
            if (o == undefined)
                return null;
        }
        return o;
    }

    /** Sets a value of data member - property path */
    public static setMember(obj: Record<string, any>, path: string, value: any) {
        var tokens = path.split('.');
        var o = obj
        for (var i = 0; i < tokens.length - 1; i++) {
            let val = o[tokens[i]];
            if (val == undefined) {
                o[tokens[i]] = val = {};
            }
            o = val;
        }
        o[tokens[tokens.length - 1]] = value;
    }

    /** Sorts an object array by providing comma separated data members */
    public static sortBy(array: Array<any>, sort: string) {
        var arr = sort.split(',');
        array.sort(function (a, b) {
            for (var i = 0; i < arr.length; i++) {
                let name = arr[i];
                const lowerName = name.toLowerCase();
                let desc = false;
                if (lowerName.endsWith(" asc"))
                    name = name.substring(0, name.length - 4);
                else if (lowerName.endsWith(" desc")) {
                    name = name.substring(0, name.length - 5);
                    desc = true;
                }
                const va = Utils.getMember(a, name);
                const vb = Utils.getMember(b, name);
                if (va == vb)
                    continue;
                var res = 1;
                if (va == undefined)
                    res = -1;
                else if (va < vb)
                    res = -1;
                if (desc)
                    res *= -1;
                return res;
            }
            return 0;
        });
    }

    /** Sorts an object array by providing value func array */
    public static sortBy2<T>(array: Array<T>, sort: ((x: T) => any)[]) {

        array.sort(function (a, b) {
            for (var i = 0; i < sort.length; i++) {
                let fn = sort[i];
                let desc = false;
                const va = fn(a);
                const vb = fn(b);
                if (va == vb)
                    continue;
                var res = 1;
                if (va == undefined)
                    res = -1;
                else if (va < vb)
                    res = -1;
                if (desc)
                    res *= -1;
                return res;
            }
            return 0;
        });
    }

    /** Groups the array by specified key and returns a Map<K,T> */
    public static groupBy<T, K>(array: Array<T>, keyFunc: (item: T) => K) {
        const groups = new Map<K, T[]>();
        for (let item of array) {
            const key = keyFunc(item);
            let items = groups.get(key);
            if (!items) {
                items = [];
                groups.set(key, items);
            }
            items.push(item);
        }

        return groups;
    }

    /** Groups the array by specified key and returns a Map<K,V> */
    public static groupBy2<T, K, V>(array: Iterable<T>, keyFunc: (item: T) => K, valueFunc: (item: T) => V) {
        const groups = new Map<K, V[]>();
        for (let item of array) {
            const key = keyFunc(item);
            let items = groups.get(key);
            if (!items) {
                items = [];
                groups.set(key, items);
            }
            items.push(valueFunc(item));
        }

        return groups;
    }

    /** Asyncronously maps the specified array to another array */
    public static async mapAsync<T, V>(array: Iterable<T>, selector: (x: T) => Promise<V>): Promise<Array<V>> {

        const result: V[] = [];
        for (let x of array) {
            let y = await selector(x);
            result.push(y);
        }
        return result;
    }

    public static sqlLike(text: string, pattern: string) {
        // Escape special regex characters in the pattern, except for % and _
        const escapedPattern = pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        // Replace SQL LIKE wildcards with regex wildcards
        const regexPattern = '^' + escapedPattern
            .replace(/%/g, '.*')  // % matches zero or more characters
            .replace(/_/g, '.')  // _ matches a single character
            + '$';
        // Create a case-insensitive regex and dot matches any char ('s' flag).
        const regex = new RegExp(regexPattern, 'is');
        return regex.test(text);
    }


    /** Slipts the array into chunks of the specified size */
    public static split<T>(array: Iterable<T>, chunkSize: number) {

        const chunks: T[][] = [];
        let chunk: T[] = [];
        for (let item of array) {
            chunk.push(item);
            if (chunk.length == chunkSize) {
                chunks.push(chunk);
                chunk = [];
            }
        }

        if (chunk.length)
            chunks.push(chunk);

        return chunks;

    }
    /** Gets the last element of the array */
    public static last<T>(array: Array<T>) {
        return array[array.length - 1];
    }

    /** String format with arguments: {0} {1} etc. */
    public static format(fmt: string, args: any[]) {

        return fmt.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number].toString()
                : match;
        });

    }

    /** Converts the decimal number to string
     * If fractionDigits is -1 it is automatically determined.
    */
    public static formatDecimal(value: number, fractionDigits = -1): string {

        if (!Number.isFinite(value)) return ''; // optional safety

        if (fractionDigits < 0) {

            const rounded = value.toFixed(6);
            const [intPart, decPartRaw] = rounded.split('.');

            // Remove trailing zeros
            let decPart = decPartRaw.replace(/0+$/, '');

            if (!decPart) return intPart; // whole number

            if (decPart.length === 1) decPart += '0'; // pad single-digit decimals

            return `${intPart}.${decPart}`;
        }

        return value.toFixed(fractionDigits);
    }

    /** Formats date to string - D = dd.mm.yyyy, DT = dd.mm.yyyy hh:mm, T = hh:mm */
    public static formatDate(date: number | string | Date | null | undefined) {

        if (!date)
            return "";

        const pad = (num: number) => String(num).padStart(2, '0');


        let d = new Date(date);

        let month = pad(d.getMonth() + 1);
        let day: any = pad(d.getDate());
        let year = d.getFullYear();

        let str = [day, month, year].join('.');

        if (0 == d.getHours() + d.getMinutes() + d.getSeconds())
            return str;


        let hh = pad(d.getHours());
        let mm = pad(d.getMinutes());

        return [str, ' ', hh, ':', mm].join('');
    }

    /** Parses date in format 'dd.MM.yyyy hh:mm:ss' */
    public static parseDate(formatedDate: string) {
        if (!formatedDate)
            return undefined;

        // Normalize delimiters to a space for easy parsing
        const normalizeInput = (str: string) => str.replace(/[\.\-/:]/g, ' ');

        let input = normalizeInput(formatedDate);

        const inputParts = input.split(/\s+/);

        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let hour = 0;
        let minute = 0;

        for (let i = 0; i < inputParts.length; i++) {

            if (i === 0) {
                day = parseInt(inputParts[i], 10);
            } else if (i === 1) {
                month = parseInt(inputParts[i], 10);
            } else if (i === 2) {
                year = parseInt(inputParts[i], 10);
                if (year < 100) {
                    year += year < 50 ? 2000 : 1900;
                }
            } else if (i === 3) {
                hour = parseInt(inputParts[i], 10);
            } else if (i === 4) {
                minute = parseInt(inputParts[i], 10);
            }
        }

        return new Date(year, month - 1, day, hour, minute);
    }

    public static formatDateToMySQL(date: Date | null | undefined) {

        if (!date)
            return null;

        const pad = (num: number) => String(num).padStart(2, '0');

        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1); // Months are zero-indexed
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    static truncateMiddle(str: any, maxLength: number) {
        if (typeof str != "string")
            str = str?.toString() ?? "";

        if (str.length <= maxLength) {
            return str;
        }

        const ellipsis = "...";
        const charsToShow = maxLength - ellipsis.length;

        if (charsToShow < 0) {
            return ellipsis; // Not enough space even for the ellipsis
        }

        const frontChars = Math.ceil(charsToShow / 2);
        const backChars = Math.floor(charsToShow / 2);

        return (
            str.substring(0x0, frontChars) + ellipsis + str.substring(str.length - backChars)
        );
    }

    /** Splits the word to syllables.
     * The method uses predefined vowels for all european languages.
    */
    public static splitToSyllables(word: string): string[] {
        if (!word)
            return [];

        const vowels = "aeiouyäöüéèêëàâîïôûùáãçýășțâîğöıåøæыэюяёұӣүαεηιουωаеёиоуыэюяё";
        const result: string[] = [];
        let tok = "";
        let tokContainsVowel = false;
        for (var i = 0; i < word.length; i++) {
            var c = word.charAt(i);
            var isVowel = vowels.indexOf(c.toLowerCase()) > -1;
            var nextIsVowel = i < word.length - 1
                && vowels.indexOf(word[i + 1].toLowerCase()) > -1;
            var prevIsSameConsonant = !isVowel && i > 0 && word[i - 1] == c;

            if (tokContainsVowel && !isVowel
                && (nextIsVowel || prevIsSameConsonant)) {
                result.push(tok);
                tok = "";
                tokContainsVowel = false;
            }

            tok += c;
            if (isVowel)
                tokContainsVowel = true;
        }

        if (tok.length > 0)
            result.push(tok);

        return result;
    }

    static pluralToSingular(word: string) {
        const irregulars: Record<string, string> = {
            children: "child",
            feet: "foot",
            geese: "goose",
            men: "man",
            mice: "mouse",
            women: "woman",
            teeth: "tooth",
            people: "person",
            oxen: "ox"
        };

        // Handle irregular cases
        if (irregulars[word.toLowerCase()]) {
            return irregulars[word.toLowerCase()];
        }

        // Handle general cases
        if (word.endsWith("ies")) {
            return word.slice(0, -3) + "y"; // e.g., "parties" -> "party"
        } else if (word.endsWith("ves")) {
            return word.slice(0, -3) + "f"; // e.g., "wolves" -> "wolf"
        } else if (word.endsWith("s") && !word.endsWith("ss")) {
            return word.slice(0, -1); // e.g., "cats" -> "cat"
        }

        // Return the word unchanged if no rules apply
        return word;
    }

    static tableNameToElementName(tableName: string) {
        const words = tableName.split(" ");
        const lastWord = words.pop()!; // Get the last word
        const singularLastWord = Utils.pluralToSingular(lastWord); // Convert it to singular
        return [...words, singularLastWord].join(" "); // Reassemble the sentence
    }


    public static isInViewport(el: HTMLElement, completely: boolean = false): boolean {
        const rect = el.getBoundingClientRect();
        const vpWidth = window.innerWidth;
        const vpHeight = window.innerHeight;

        if (completely) {
            return rect.top >= 0 && rect.left >= 0 &&
                rect.bottom <= vpHeight && rect.right <= vpWidth;
        } else {
            return rect.bottom > 0 && rect.right > 0 &&
                rect.top < vpHeight && rect.left < vpWidth;
        }
    }

    public static getScrollParent(el: HTMLElement | null): HTMLElement {
        let parent = el?.parentElement;
        while (parent) {
            const style = getComputedStyle(parent);
            const overflowY = style.overflowY;
            const overflowX = style.overflowX;
            const canScrollY = overflowY === "auto" || overflowY === "scroll";
            const canScrollX = overflowX === "auto" || overflowX === "scroll";

            if ((canScrollY && parent.scrollHeight > parent.clientHeight) ||
                (canScrollX && parent.scrollWidth > parent.clientWidth)) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return document.scrollingElement as HTMLElement;
    }

    public static scrollIntoViewIfNeeded(el: HTMLElement) {
        const parent = Utils.getScrollParent(el);
        const elRect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        // Account for scrollbars by using clientWidth/clientHeight
        const parentVisibleWidth = parent.clientWidth;
        const parentVisibleHeight = parent.clientHeight;

        // Vertical scroll
        if (elRect.top < parentRect.top) {
            parent.scrollTop -= (parentRect.top - elRect.top);
        } else if (elRect.bottom > parentRect.top + parentVisibleHeight) {
            parent.scrollTop += (elRect.bottom - (parentRect.top + parentVisibleHeight));
        }

        // Horizontal scroll
        if (elRect.left < parentRect.left) {
            parent.scrollLeft -= (parentRect.left - elRect.left);
        } else if (elRect.right > parentRect.left + parentVisibleWidth) {
            parent.scrollLeft += (elRect.right - (parentRect.left + parentVisibleWidth));
        }

        // Finally, ensure element is visible in the viewport
        const vpWidth = window.innerWidth;
        const vpHeight = window.innerHeight;
        const rect = el.getBoundingClientRect();

        if (rect.top < 0 || rect.bottom > vpHeight || rect.left < 0 || rect.right > vpWidth) {
            el.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
        }
    }


    /**
     * Returns image dimensions for specified URL.
     */
    public static getImageDimensions(url: string): Promise<{ width: number, height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({
                width: img.width,
                height: img.height,
            });
            img.onerror = (error) => reject(error);
            img.src = url;
        });
    };

    /** Converts the image into webp format */
    public static async convertImageToWebp(url: string, options?: {
        maxWidth?: number,
        maxHeight?: number,
        quality?: number
    })
        : Promise<{ blob: Blob, width: number, height: number }> {

        return new Promise((resolve) => {

            const img = new Image();
            img.src = url;
            img.onerror = function () {
                URL.revokeObjectURL(url);
            };
            img.onload = function () {

                let size = 1;
                let quality = 1;


                if (options) {

                    let w = img.width,
                        h = img.height;

                    if (options.maxWidth && w > options.maxWidth) {
                        h = Math.round((h * options.maxWidth) / w);
                        w = options.maxWidth;
                    }
                    if (options.maxHeight && h > options.maxHeight) {
                        w = Math.round((w * options.maxHeight) / h);
                        h = options.maxHeight;
                    }

                    size = w / img.width;

                    if (options.quality)
                        quality = options.quality;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // Use the intrinsic size of image in CSS pixels for the canvas element
                canvas.width = img.naturalWidth * size;
                canvas.height = img.naturalHeight * size;

                // To use the custom size we'll have to specify the scale parameters
                // using the element's width and height properties - lets draw one
                // on top in the corner:
                ctx.scale(size, size);
                ctx.drawImage(img, 0, 0);

                //const resultUrl = canvas.toDataURL(`image/${format}`, quality);
                const result = {
                    blob: null,
                    //url: resultUrl,
                    //contentType: resultUrl.match(/^data\:([^\;]+)\;base64,/im)[1] || "",
                    //b64: resultUrl.replace(/^data\:([^\;]+)\;base64,/gim, ""),
                    size: 0,
                    width: canvas.width,
                    height: canvas.height
                };

                canvas.toBlob(
                    (blob) => {
                        //@ts-ignore
                        result.blob = blob;
                        result.size = blob!.size;
                        //@ts-ignore
                        resolve(result);
                    },
                    "image/webp",
                    quality
                );

            }
        });
    }

    /** Resizes an image by provided url */
    public static async resizeImage(
        url: string,
        options?: {
            maxWidth?: number,
            maxHeight?: number,
            contentType?: string,
            quality?: number
        }): Promise<{ blob: Blob, url: string, contentType: string, b64: string, size: number, width: number, height: number }> {

        options = options || {};
        options.maxWidth = options.maxWidth ?? 1920;
        options.maxHeight = options.maxHeight ?? 1080;
        options.quality = options.quality ?? 0.7;
        options.contentType = options.contentType || "image/jpeg";

        const calculateSize = (img: HTMLImageElement) => {
            let w = img.width,
                h = img.height;
            if (options.maxWidth && w > options.maxWidth) {
                h = Math.round((h * options.maxWidth) / w);
                w = options.maxWidth;
            }
            if (options.maxHeight && h > options.maxHeight) {
                w = Math.round((w * options.maxHeight) / h);
                h = options.maxHeight;
            }
            return [w, h];
        };

        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onerror = function () {
                URL.revokeObjectURL(url);
            };
            img.onload = function () {
                URL.revokeObjectURL(url);
                const [newWidth, newHeight] = calculateSize(img);
                const canvas = document.createElement("canvas");
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext("2d")!;

                // Draw smoothly
                const oc = document.createElement('canvas');
                const octx = oc.getContext('2d')!;

                var cur = {
                    width: Math.floor(img.width * 0.5),
                    height: Math.floor(img.height * 0.5)
                }

                oc.width = cur.width;
                oc.height = cur.height;

                octx.drawImage(img, 0, 0, cur.width, cur.height);

                while (cur.width * 0.5 > newWidth) {
                    cur = {
                        width: Math.floor(cur.width * 0.5),
                        height: Math.floor(cur.height * 0.5)
                    };
                    octx.drawImage(oc, 0, 0, cur.width * 2, cur.height * 2, 0, 0, cur.width, cur.height);
                }

                ctx.drawImage(oc, 0, 0, cur.width, cur.height, 0, 0, canvas.width, canvas.height);

                // Instead of:
                //ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const resultUrl = canvas.toDataURL(options.contentType, options.quality);
                const result = {
                    blob: <Blob | null>null,
                    url: resultUrl,
                    contentType: resultUrl.match(/^data\:([^\;]+)\;base64,/im)![1] || "",
                    b64: resultUrl.replace(/^data\:([^\;]+)\;base64,/gim, ""),
                    size: 0,
                    width: newWidth,
                    height: newHeight
                };

                canvas.toBlob(
                    (blob) => {
                        result.blob = blob;
                        result.size = blob!.size;
                        //@ts-ignore
                        resolve(result);
                    },
                    options.contentType,
                    options.quality
                );
            };
        });
    }

    /** Gets the error message */
    static getErrorText(error: any) {
        let msg = "";
        if (error instanceof PromiseRejectionEvent)
            error = error.reason;
        else if (error instanceof ErrorEvent)
            msg = error.message;

        if (error instanceof Error)
            msg = error.message;
        else if (typeof error == "object" && "message" in error)
            msg = error.message;
        else
            msg = typeof error == "string" ? error : JSON.stringify(error, null, 2);

        if (typeof error == "object" && "type" in error && typeof (error.type) == "string") {
            let typeCode = error.type;
            if ("code" in error && error.code != 0)
                typeCode = `${typeCode} ${error.code}`;
            msg = `${typeCode}\r\n\r\n${msg}`;
        }
        return msg;
    }

    // Static method to add days
    static addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // Static method to add months
    static addMonths(date: Date, months: number): Date {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    // Static method to add years
    static addYears(date: Date, years: number): Date {
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        return result;
    }

    private static globalThrottleCounterMap = new Map();
    /** Delays the execution of func with ms. If another call arrives within ms period it is discarded. */
    static async throttle(key: any, func: () => any, ms = 100) {
        let counter = this.globalThrottleCounterMap.get(key) ?? 0;
        counter++;
        this.globalThrottleCounterMap.set(key, counter);
        const local = counter;
        await Utils.delay(ms);
        if (local == this.globalThrottleCounterMap.get(key)) {
            this.globalThrottleCounterMap.delete(key);
            func();
        }
    }

    /** Resolves when the next animation frame is ready */
    static nextFrame = (): Promise<number> =>
        new Promise((resolve) => requestAnimationFrame(resolve));

}



export class Optional<T> {
    readonly isEmpty: boolean;
    readonly value: T;
    constructor(value: T, isEmpty = false) {
        this.isEmpty = isEmpty;
        this.value = value;
    }
    static empty<T>(): Optional<T> {
        return new Optional(undefined!, true);
    }
}

export class CriticalSection {
    private _locked: boolean = false;
    private _waitingResolvers: Array<() => void> = [];

    readonly name: string;
    constructor(name: string) {
        this.name = name;
    }

    async enterAsync(): Promise<void> {
        if (!this._locked) {
            this._locked = true;
            return;
        }

        return new Promise<void>((resolve) => {
            this._waitingResolvers.push(resolve);
        });
    }

    exit(): void {
        if (this._waitingResolvers.length > 0) {
            const nextResolve = this._waitingResolvers.shift();
            if (nextResolve) {
                nextResolve(); // Allow the next waiter to continue
            }
        } else {
            this._locked = false;
        }
    }

    async wrap(func: () => Promise<any>) {
        await this.enterAsync();
        try {
            await func();
        }
        finally {
            this.exit();
        }
    }
}


export class Index<T> {

    readonly array: T[] = [];
    readonly index: Map<T, number> = new Map();

    public add(item: T): boolean {
        if (this.index.has(item))
            return false;
        this.index.set(item, this.array.length);
        this.array.push(item);
        return true;
    }

    /**Returns the item index */
    public getOrAdd(item: T): number {

        let ix = this.indexOf(item);
        if (ix < 0) {
            ix = this.array.length;
            this.index.set(item, this.array.length);
            this.array.push(item);
        }
        return ix;
    }

    public clear() {
        this.array.splice(0, this.array.length);
        this.index.clear();
    }

    public count(): number {
        return this.array.length;
    }

    public get(i: number) {
        return this.array[i];
    }

    /** Finds the index of the item */
    public indexOf(x: T): number {

        return this.index.get(x) ?? -1;
    }

    /** Removes the item and returns the index of the item before remove. */
    public remove(item: T): number {
        let ix = this.indexOf(item);
        if (ix > -1) {
            this.index.delete(item);
            this.array.splice(ix, 1);
        }
        return ix;
    }
}

export class Lazy<T> {
    private lock: CriticalSection = new CriticalSection("Lazy");
    private init: () => Promise<T>;
    private _value?: T;
    constructor(init: () => Promise<T>) {
        this.init = init;
    }
    public async value(): Promise<T> {
        let value = this._value;
        if (typeof value !== "undefined")
            return value;
        try {
            await this.lock.enterAsync();
            if (typeof value !== "undefined")
                return value;
            value = await this.init();
            this._value = value;
        }
        finally {
            this.lock.exit();
        }

        return value;
    }
}

export class ConcurrentMap<T> {
    private map: Map<string, T> = new Map();
    private lock: CriticalSection = new CriticalSection("ConcurrentMap");
    public async getOrAddAsync(key: string, add: () => Promise<T>): Promise<T> {
        let value = this.map.get(key);
        if (typeof value !== "undefined")
            return value;
        try {
            await this.lock.enterAsync();
            value = this.map.get(key);
            if (typeof value !== "undefined")
                return value;

            value = await add();
            this.map.set(key, value);

        }
        finally {
            this.lock.exit();
        }

        return value;
    }

}


