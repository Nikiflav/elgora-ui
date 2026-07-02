// ======================================================
// e() typed HTML factory
// ======================================================

import { applyUi, Component, ComponentChild } from "./Component"
import { UiStyle } from "./UiStyle"


// ------------------------------------------------------
// Remove function members from HTMLElement types
// (prevents IntelliSense pollution like click(), focus())
// ------------------------------------------------------

type NativePropKeys<T> = {
    [K in keyof T]:
    T[K] extends Function ? never :
    K extends `on${string}` ? never :
    K extends "style" ? never :
    K
}[keyof T]

type NativeProps<T> = {
    [K in NativePropKeys<T>]?: T[K]
}

// ------------------------------------------------------
// DOM Events
// onclick, oninput, onkeydown ...
// correctly typed event + typed element
// ------------------------------------------------------

type DOMEvents<T extends HTMLElement> = {
    [K in keyof GlobalEventHandlersEventMap as `on${K}`]?: (
        event: GlobalEventHandlersEventMap[K],
        el: T
    ) => void
}

// ------------------------------------------------------
// Custom props
// ------------------------------------------------------
type WritableCSSProperties = {
    [K in keyof CSSStyleDeclaration]:
    CSSStyleDeclaration[K] extends string
    ? K
    : never
}[keyof CSSStyleDeclaration]

export type StyleObject = Partial<
    Record<WritableCSSProperties, string | number>
>

type ExtraProps = {
    class?: string
    className?: string
    style?: StyleObject
    ui?: UiStyle | UiStyle[]
    vnodes?: VNodeChild[]
}

// ------------------------------------------------------
// Final props for each tag
// --------------------------------------------------

export type ElementProps<T extends HTMLElement> =
    NativeProps<T> &
    DOMEvents<T> &
    ExtraProps

// ------------------------------------------------------
// Function args
//
// e("div")
// e("div", "hello")
// e("div", child1, child2)
// e("div", { class:"x" })
// e("div", { class:"x" }, child1, child2)
// ------------------------------------------------------

export type ElementArgs<T extends HTMLElement> =
    [props?: ElementProps<T>, ...children: ComponentChild[]] |
    ComponentChild[]

// ------------------------------------------------------
// VNode
// ------------------------------------------------------

export type VNode<T extends HTMLElement> = {
    tag: keyof HTMLElementTagNameMap,
    props: ElementProps<T>
}

export type VNodeChild = VNode<any> | string | number | null | undefined

export type VNodeArgs<T extends HTMLElement> =
    [props?: ElementProps<T>, ...children: VNodeChild[]] |
    VNodeChild[]

export function v<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    ...args: VNodeArgs<HTMLElementTagNameMap[K]>
): VNode<HTMLElementTagNameMap[K]> {

    if (isProps(args[0])) {
        const props = args[0] as ElementProps<HTMLElementTagNameMap[K]>
        props.vnodes = args.slice(1) as any[]
        return {
            tag,
            props
        }
    }

    return {
        tag,
        props: { vnodes: args as any[] } as ElementProps<HTMLElementTagNameMap[K]>
    }
}

// ------------------------------------------------------
// Main declaration
// ------------------------------------------------------

export function e<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    ...args: ElementArgs<HTMLElementTagNameMap[K]>
): HTMLElementTagNameMap[K]


// ------------------------------------------------------
// Implementation signature
// ------------------------------------------------------

export function e(
    tag: string,
    ...args: any[]
): HTMLElement {

    const el = document.createElement(tag)

    let props: any = {}
    let children: any[] = []

    if (isProps(args[0])) {
        props = args[0]
        children = args.slice(1)
    } else {
        children = args
    }

    setElementProps(el, props)
    appendChildren(el, children)

    return el
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function isProps(v: any): boolean {
    return v &&
        typeof v === "object" &&
        !(v instanceof Node) &&
        !(v instanceof Component) &&
        !Array.isArray(v)
}

function appendChildren(
    parent: HTMLElement,
    children: ComponentChild
): void {

    const list = Array.isArray(children) ? children : [children];

    for (const child of list) {

        if (child == null)
            continue

        if (child instanceof Component)
            child.mount(parent)

        else if (child instanceof Node)
            parent.appendChild(child)

        else
            parent.appendChild(
                document.createTextNode(String(child))
            )
    }
}

// ------------------------------------------------------
// Stored props & Event listeners
// ------------------------------------------------------

const STORED_PROPS_KEY = Symbol("_elgStoredProps")
const EVENT_LISTENERS_KEY = Symbol("_elgEventListeners")

interface StoredProps {
    [key: string]: any
}

interface EventListenerEntry {
    listener: EventListener
    wrapper: EventListener
}

// ------------------------------------------------------
// applyElementProps
// ------------------------------------------------------

/**
 * Changes only the given props.
 * @param el The element to apply the props to.
 * @param props The props to apply.
 */
export function assignElementProps<T extends HTMLElement>(
    el: T,
    props?: ElementProps<T>
): void {
    setElementProps(el, props, true);
}

/**
 * Applies the given props to the given element.
 * Uses diff to apply only the changes.
 * @param el The element to apply the props to.
 * @param props The props to apply.
 * @param assign If true only the provided props are modified, otherwise the not provided stored props are reset to null/default value.
 */
export function setElementProps<T extends HTMLElement>(
    el: T,
    props?: ElementProps<T>,
    assign = false
): void {

    if (!props) return

    const stored = (el as any)[STORED_PROPS_KEY] as StoredProps | undefined
    const eventMap = (el as any)[EVENT_LISTENERS_KEY] as Map<string, EventListenerEntry> | undefined

    let contentSet = false;

    for (const key in props) {

        if (key == "textContent" || key == "innerHTML" || key == "vnodes") {
            contentSet = true;
        }

        const value = (props as any)[key]
        const oldValue = stored?.[key]

        if (key == "vnodes") {
            const newNodes = value as (VNode<HTMLElement> | null)[]

            const newCount = newNodes?.length ?? 0

            for (let i = 0; i < newCount; i++) {
                patch(el, newNodes[i], i)
            }
            while (el.childNodes.length > newCount) {
                el.removeChild(el.lastChild!)
            }

            continue;
        }

        if (value === oldValue)
            continue

        if (value === undefined || value === null) {
            if (oldValue !== undefined && oldValue !== null)
                removeProp(el, key, oldValue, eventMap)
            continue
        }

        applySingleProp(el, key, value, oldValue, eventMap, assign)
    }

    if (stored && !assign) {
        for (const key in stored) {

            if (!(key in props)) {

                if (key == "textContent" || key == "innerHTML" || key == "vnodes") {
                    if (contentSet)
                        continue;
                }

                if (key == "vnodes") {
                    // Remove all children.
                    el.replaceChildren()
                    continue;
                }

                removeProp(el, key, stored[key], eventMap)
            }
        }
    }

    (el as any)[STORED_PROPS_KEY] = { ...props }
}

function applySingleProp<T extends HTMLElement>(
    el: T,
    key: string,
    value: any,
    oldValue: any,
    eventMap: Map<string, EventListenerEntry> | undefined,
    merge: boolean
): void {

    if (
        key.startsWith("on") &&
        typeof value === "function"
    ) {
        const eventName = key.slice(2).toLowerCase()
        const map = eventMap || new Map<string, EventListenerEntry>()

        const existing = map.get(eventName)
        if (existing) {
            el.removeEventListener(eventName, existing.wrapper)
        }

        const wrapper = (ev: Event) => (value as Function)(ev, el)
        el.addEventListener(eventName, wrapper)

        map.set(eventName, { listener: value, wrapper })
        if (!(el as any)[EVENT_LISTENERS_KEY]) {
            (el as any)[EVENT_LISTENERS_KEY] = map
        }

        return
    }

    if (
        key === "style" &&
        typeof value === "object"
    ) {
        const style = el.style as any
        const oldStyle = (typeof oldValue === "object" && oldValue) ? oldValue as Record<string, string> : {}

        for (const prop in value) {
            const newVal = (value as any)[prop]
            const oldVal = oldStyle[prop]
            if (newVal !== oldVal)
                style[prop] = newVal
        }

        if (!merge)
            for (const prop in oldStyle) {
                if (!(prop in value))
                    style[prop] = ""
            }
        return
    }

    if (key === "ui") {
        applyUi(el, value)
        return
    }

    if (
        key === "class" ||
        key === "className"
    ) {
        el.className = String(value)
        return
    }

    if (key in el) {
        try {
            (el as any)[key] = value
            return
        }
        catch { }
    }

    el.setAttribute(key, String(value))
}

function removeProp<T extends HTMLElement>(
    el: T,
    key: string,
    oldValue: any,
    eventMap: Map<string, EventListenerEntry> | undefined
): void {

    if (
        key.startsWith("on") &&
        typeof oldValue === "function"
    ) {
        const eventName = key.slice(2).toLowerCase()
        const map = eventMap
        if (map) {
            const existing = map.get(eventName)
            if (existing && existing.listener === oldValue) {
                el.removeEventListener(eventName, existing.wrapper)
                map.delete(eventName)
            }
        }
        return
    }

    if (key === "style" && typeof oldValue === "object") {
        const style = el.style as any
        for (const prop in oldValue)
            style[prop] = ""
        return
    }

    if (key === "ui") {
        el.className = ""
        return
    }

    if (key === "class" || key === "className") {
        el.className = ""
        return
    }

    if (key in el) {
        try {
            (el as any)[key] = null
            return
        }
        catch { }
    }

    el.removeAttribute(key)
}


function patch(parent: HTMLElement, newVNode: VNode<HTMLElement> | null, index = 0): void {
    const currentDom = parent.childNodes[index] as HTMLElement

    // 1. Cleanup removed elements and wipe active structural subscriptions
    if (newVNode == null) {
        if (currentDom) {
            parent.removeChild(currentDom)
        }
        return
    }

    // 2. Handle simple text strings/numbers
    if (typeof newVNode !== "object" || !("tag" in newVNode)) {
        const text = String(newVNode)
        if (!currentDom) {
            parent.appendChild(document.createTextNode(text))
        } else if (currentDom.nodeType === Node.TEXT_NODE) {
            if (currentDom.nodeValue !== text) currentDom.nodeValue = text
        } else {
            parent.replaceChild(document.createTextNode(text), currentDom)
        }
        return
    }

    // 4. Handle Native Element tags ("div", "span", "button", etc.)
    if (typeof newVNode.tag === "string") {
        if (!currentDom || currentDom.nodeName.toLowerCase() !== newVNode.tag.toLowerCase()) {
            const el = e(newVNode.tag, newVNode.props)

            if (currentDom) {
                parent.replaceChild(el, currentDom)
            } else {
                parent.appendChild(el)
            }
        } else {
            setElementProps(currentDom, newVNode.props)
        }
    }
}


// ======================================================
// HTML Tag Helpers for e()
// ======================================================

// Usage:
//
// div(
//     h1("Hello"),
//     p("Welcome"),
//     button({ onclick: () => alert("Hi") }, "Click")
// )

// ------------------------------------------------------
// Generic helper type
// ------------------------------------------------------

type TagFactory<K extends keyof HTMLElementTagNameMap> =
    (
        ...args: ElementArgs<HTMLElementTagNameMap[K]>
    ) => HTMLElementTagNameMap[K]

// ------------------------------------------------------
// Helper creator
// ------------------------------------------------------

function tag<K extends keyof HTMLElementTagNameMap>(
    name: K
): TagFactory<K> {

    return (...args) => e(name, ...args)
}

// ------------------------------------------------------
// Major layout tags
// ------------------------------------------------------

export const div = tag("div")
export const span = tag("span")
export const section = tag("section")
export const article = tag("article")
export const header = tag("header")
export const footer = tag("footer")
export const main = tag("main")
export const nav = tag("nav")
export const aside = tag("aside")

// ------------------------------------------------------
// Headings
// ------------------------------------------------------

export const h1 = tag("h1")
export const h2 = tag("h2")
export const h3 = tag("h3")
export const h4 = tag("h4")
export const h5 = tag("h5")
export const h6 = tag("h6")

// ------------------------------------------------------
// Text
// ------------------------------------------------------

export const p = tag("p")
export const strong = tag("strong")
export const em = tag("em")
export const small = tag("small")
export const label = tag("label")
export const pre = tag("pre")
export const code = tag("code")
export const br = tag("br")
export const hr = tag("hr")

// ------------------------------------------------------
// Forms
// ------------------------------------------------------

export const form = tag("form")
export const input = tag("input")
export const textarea = tag("textarea")
export const select = tag("select")
export const option = tag("option")
export const button = tag("button")

// ------------------------------------------------------
// Lists
// ------------------------------------------------------

export const ul = tag("ul")
export const ol = tag("ol")
export const li = tag("li")

// ------------------------------------------------------
// Tables
// ------------------------------------------------------

export const table = tag("table")
export const thead = tag("thead")
export const tbody = tag("tbody")
export const tr = tag("tr")
export const td = tag("td")
export const th = tag("th")

// ------------------------------------------------------
// Media
// ------------------------------------------------------

export const img = tag("img")
export const a = tag("a")
export const video = tag("video")
export const audio = tag("audio")
export const canvas = tag("canvas")

