// ======================================================
// c() Typed Component Factory
// ======================================================

import { Component, ComponentChild, ComponentLifecycleProps } from "./Component"
import { UiStyle } from "./UiStyle"



// ======================================================
// Remove function members from DOM element props
// ======================================================

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

// ======================================================
// Typed DOM events -> onclick, oninput ...
// event + component + typed element
// ======================================================

type ComponentEvents<T extends HTMLElement> = {
    [K in keyof GlobalEventHandlersEventMap as `on${K}`]?: (
        event: GlobalEventHandlersEventMap[K],
        com: Component,
        el: T
    ) => void
}
// ======================================================
// Extra props
// ======================================================


type StyleValue =
    string |
    number |
    undefined

type StyleObject = {
    [key: string]: StyleValue
}

type ExtraProps = {
    /** Child content supplied through props. Positional children take precedence when both forms are used. */
    children?: ComponentChild
    key?: any
    ui?: UiStyle | UiStyle[]
    class?: string
    className?: string
    style?: StyleObject
}

// ======================================================
// Final typed props
// ======================================================

/** Typed properties accepted by a Component-backed HTML element factory. */
export type ComponentProps<
    T extends HTMLElement
> =
    NativeProps<T> &
    ComponentEvents<T> &
    ComponentLifecycleProps &
    ExtraProps

// ======================================================
// Args
// ======================================================

/**
 * Arguments accepted by a Component-backed HTML element factory.
 *
 * Child content may be passed in the props object's `children` property or
 * as one or more positional arguments. Positional children take precedence.
 */
export type ComponentArgs<
    T extends HTMLElement
> =
    [props?: ComponentProps<T>, ...children: ComponentChild[]]
    | ComponentChild[]

// ======================================================
// c() declaration
// ======================================================

/**
 * Creates a Component backed by the requested HTML tag.
 *
 * Children can be supplied either as `props.children` or as positional
 * arguments after the props object. When both forms are present, positional
 * children take precedence.
 *
 * @example
 * c("button", { ui: ["elg", "btn", "primary"], children: "Save" })
 * c("button", { ui: ["elg", "btn", "primary"] }, "Save")
 */
export function c<
    K extends keyof HTMLElementTagNameMap
>(
    tag: K,
    ...args: ComponentArgs<HTMLElementTagNameMap[K]>
): Component

// ======================================================
// c() implementation
// ======================================================

export function c(
    tag: string,
    ...args: any[]
): Component {

    let props: any = {}
    let positionalChildren: any[] = []

    if (isProps(args[0])) {
        props = args[0]
        positionalChildren = args.slice(1)
    }
    else {
        positionalChildren = args
    }

    const { children: propChildren, ...componentProps } = props
    const children = positionalChildren.length > 0 ? positionalChildren : propChildren

    return new Component({
        tag,
        ...componentProps,
        children
    })
}

// ======================================================
// Helpers
// ======================================================

function isProps(v: any): boolean {
    return v &&
        typeof v === "object" &&
        !(v instanceof Node) &&
        !(v instanceof Component) &&
        !Array.isArray(v)
}

// ======================================================
// Generic helper creator
// ======================================================

type ComponentFactory<
    K extends keyof HTMLElementTagNameMap
> =
(
    ...args: ComponentArgs<
        HTMLElementTagNameMap[K]
    >
) => Component

function ctag<
    K extends keyof HTMLElementTagNameMap
>(
    tag: K
): ComponentFactory<K> {

    return (...args) => c(tag, ...args)
}

// ======================================================
// Major helpers
// ======================================================

// Layout
/** Creates a Component backed by a div element. */
export const cdiv     = ctag("div")
export const cspan    = ctag("span")
export const csection = ctag("section")
export const carticle = ctag("article")
export const cheader  = ctag("header")
export const cfooter  = ctag("footer")
export const cmain    = ctag("main")
export const cnav     = ctag("nav")
export const caside   = ctag("aside")

// Headings
export const ch1 = ctag("h1")
export const ch2 = ctag("h2")
export const ch3 = ctag("h3")
export const ch4 = ctag("h4")
export const ch5 = ctag("h5")
export const ch6 = ctag("h6")

// Text
export const cp      = ctag("p")
export const cstrong = ctag("strong")
export const cem     = ctag("em")
export const csmall  = ctag("small")
export const clabel  = ctag("label")
export const cpre    = ctag("pre")
export const ccode   = ctag("code")

// Forms
export const cform     = ctag("form")
export const cinput    = ctag("input")
export const ctextarea = ctag("textarea")
export const cselect   = ctag("select")
export const coption   = ctag("option")
/**
 * Creates a Component backed by a button element.
 * Children may be provided through `children` in the props object or as
 * positional arguments; positional arguments take precedence.
 */
export const cbutton   = ctag("button")

// Lists
export const cul = ctag("ul")
export const col = ctag("ol")
export const cli = ctag("li")

// Tables
export const ctable = ctag("table")
export const cthead = ctag("thead")
export const ctbody = ctag("tbody")
export const ctr    = ctag("tr")
export const ctd    = ctag("td")
export const cth    = ctag("th")

// Media
export const caudio  = ctag("audio")
export const cvideo  = ctag("video")
export const ccanvas = ctag("canvas")
export const cimg    = ctag("img")
export const ca      = ctag("a")
