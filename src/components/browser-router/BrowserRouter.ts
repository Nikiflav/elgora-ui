import { Component } from "../../core/Component";
/**
 * Defines a route handler for the router. Each handler can specify a URL pattern (either as a string with parameters or as a regular expression) and a function to create the corresponding page component when the route is matched.
 */
export interface RouterHandler {
    path?: string;
    regex?: RegExp;
    createPage(urlParams?: any): RouterPage;
}
/**
 * Represents a page in the router. Each page has a DOM element, a title, and an optional description. It also defines lifecycle methods for initialization, URL changes, and unloading.
 */
export interface RouterPage {

    /** The DOM element representing the page */
    readonly dom: HTMLElement;
    /** Gets the page title */
    readonly title: string
    /** Gets the page description */
    readonly description?: string;
    /** Called when the page is loaded into container element */
    init?(): Promise<any>;
    /** Called when this is the current page and the new url does not change the page. */
    onUrlChanged?(routeParams?: any): Promise<any>;
    /** Called on page unload. Returns the message to be shown if the page should remain active or undefined. */
    onUnload?(): string | undefined;
}

/**
 * A simple client-side router that uses the browser's history API to manage navigation without hard page reloads. It listens for URL changes and updates the displayed page accordingly based on a set of defined routes.
 * The url path is stored as url parameter named '!'. Example ?!=/home/sub1/sub2
 * Url parameter is used instead of hash to allow better support for server-side redirects.
 * The router also supports dynamic route parameters and provides a default 404 page if no matching route is found. It also handles navigation through anchor tags and the browser's back/forward buttons.
 * To use the router, create an instance of `BrowserRouter` with an array of route handlers and optionally a custom 404 page. Each route handler defines a URL pattern and a function to create the corresponding page component. The router will automatically manage the displayed content based on the current URL.
 * Only one instance of `BrowserRouter` should be created in the application, and it should be mounted to a container element where the page content will be displayed.
 */
export class BrowserRouter extends Component {
    public readonly routes: RouterHandler[];
    /** The currently active page */
    public page404: RouterPage;
    /** The last handled URL */
    public lastUrl?: string;

    private _currentPage?: RouterPage;
    private _currentRoute?: RouterHandler;


    private static instance: BrowserRouter;

    constructor(routes: RouterHandler[], page404?: RouterPage) {

        if (BrowserRouter.instance)
            throw new Error("BrowserRouter instance already exists. Only one instance is allowed.");

        super({ ui: ["flex-1", "overflow-auto"] });
        const self = this;
        BrowserRouter.instance = self;
        this.routes = routes;
        this.page404 = page404 || {
            dom: document.createElement("div"),
            title: "Page not found",
            description: "Page not found",
            init: async () => {
                // Default 404 page if not provided.
                this.dom.textContent = "404 - Page not found";
                this.dom.style.textAlign = "center";
                this.dom.style.padding = "50px";
                this.dom.style.fontSize = "24px";
            }
        };

        this.run();
    }
    /**
     * Gets or sets the current page. Setting a new page will replace the content of the router container with the new page's DOM element.
     */
    public get currentPage(): RouterPage | undefined {
        return this._currentPage;
    }

    public set currentPage(page: RouterPage | undefined) {
        if (this._currentPage) {
            this.dom.removeChild(this._currentPage.dom);
        }
        this._currentPage = page;
        if (this._currentPage) {
            this.dom.appendChild(this._currentPage.dom);
            this.initPage(this._currentPage);
        }
    }

    public get currentRoute(): RouterHandler | undefined {
        return this._currentRoute;
    }

    private async initPage(page: RouterPage) {
        if (page.init)
            await page.init();

        if (page.title)
            document.title = page.title;
        if (page.description) {
            // set the description of the document to the description of the route
            var meta = document.querySelector('meta[name="description"]');
            if (meta)
                meta.setAttribute("content", page.description);
        }
    }

    private getRouteRegex(r: RouterHandler) {
        let rx = r.regex;
        if (!rx && r.path) {
            let pattern = r.path.replace(/{([\w_]+)(:\w*)?}/g, function (m, name, type) {
                let pat = "[^\\/\\?#&]+";
                switch (type) {
                    case ":int": pat = "\\d+"; break;
                    case ":guid": pat = "[a-fA-F0-9\\-]+"; break;
                }
                return `(?<${name}>\\b${pat}\\b)`;
            });
            rx = new RegExp("^" + pattern);
        }
        return rx;
    }

    // The path is stored as url parameter named '!'. Exaple ?!=/home/sub1/sub2
    private locationHandler = async () => {
        this.lastUrl = window.location.href;
        const paramStr = window.location.search; // get the url params
        const searchParams = new URLSearchParams(paramStr);
        const location = searchParams.get("!") || "/";

        // get the route object from the urlRoutes object
        var route: RouterHandler | undefined = undefined;
        var routeParams: object | undefined = undefined;
        var matchedLength = -1;
        for (const r of this.routes) {

            const rx = this.getRouteRegex(r);
            const match = rx && rx.exec(location);
            if (match && match[0].length > matchedLength) {
                route = r;
                // @ts-ignore
                routeParams = match.groups;
                matchedLength = match[0].length;
            }
        }
        // create page
        if (route) {

            if (route == this._currentRoute) {

                if (this.currentPage && this.currentPage.onUrlChanged)
                    await this.currentPage.onUrlChanged(routeParams);
                return;
            }

            this._currentRoute = route;
            var page = await route.createPage(routeParams);
            this.currentPage = page;

        } else {
            if (this.currentPage != this.page404) {
                this._currentRoute = undefined;
                this.currentPage = this.page404;
            }
        }
    };

    private run() {

        // create document click that watches the nav links only
        document.addEventListener("click", (e) => {
            if (e.defaultPrevented)
                return;
            const target = <HTMLElement>e.target;
            const anchor = target && target.closest("a");
            if (!anchor)
                return;

            if (!anchor.href)
                return;

            if (anchor.getAttribute("target"))
                return;

            if (e.ctrlKey)
                return;

            const href = new URL(anchor.href);
            if (href.pathname != window.location.pathname)
                return;

            e.preventDefault();
            BrowserRouter.navigate(anchor.href);
        });

        // listen popstate
        window.addEventListener('popstate', (e) => {
            const url = window.location.href;
            if (!this.canLeaveCurrentPage(url) && this.lastUrl) {
                // Push back the previous url
                history.pushState({}, "", this.lastUrl);
                return;
            }
            this.locationHandler();
        });
        window.addEventListener("beforeunload", (e) => {
            if (this.currentPage
                && this.currentPage.onUnload) {

                const msg = this.currentPage.onUnload();
                if (typeof msg == "string") {
                    e.preventDefault();
                    // Some browsers require setting returnValue
                    e.returnValue = "";
                    return msg;
                }
            }
        });

        // initialize
        this.locationHandler();
    }

    /** Navigates the browser to the specified url without hard reload. */
    public static navigate(url: string, replaceHistory = false) {

        if (!BrowserRouter.instance.canLeaveCurrentPage(url))
            return;
        if (replaceHistory)
            window.history.replaceState({}, "", url);
        else
            window.history.pushState({}, "", url);
        BrowserRouter.instance.locationHandler();
    }

    private canLeaveCurrentPage(newUrl: string) {
        if (this._currentRoute
            && this._currentPage
            && this._currentPage.onUnload) {

            // If current route matches new URL then we don't realy leave current page.
            if (newUrl) {
                const searchParams = new URLSearchParams(newUrl);
                const location = searchParams.get("!");
                if (location && this.getRouteRegex(this._currentRoute)?.exec(location))
                    return true;
            }
            const msg = this._currentPage.onUnload();
            if (typeof msg == "string")
                return confirm(msg);
        }
        return true;
    }
}
