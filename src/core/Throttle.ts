/**
 * Simple time-based throttle with trailing execution.
 */
export class Throttle<T extends (...args: any[]) => void> {
    private lastInvokeTime = 0
    private timer: number | null = null
    private lastArgs: Parameters<T> | null = null

    constructor(
        private fn: T,
        private delay: number
    ) { }

    /**
     * Call the throttled function.
     */
    call(...args: Parameters<T>): void {
        const now = performance.now()
        const elapsed = now - this.lastInvokeTime

        this.lastArgs = args

        if (elapsed >= this.delay) {
            // immediate execution
            this.invoke()
        } else {
            // schedule trailing call
            if (this.timer != null) {
                clearTimeout(this.timer)
            }

            this.timer = window.setTimeout(() => {
                this.invoke()
            }, this.delay - elapsed)
        }
    }

    /**
     * Immediately executes with latest args.
     */
    private invoke(): void {
        this.lastInvokeTime = performance.now()

        if (this.timer != null) {
            clearTimeout(this.timer)
            this.timer = null
        }

        if (this.lastArgs) {
            this.fn(...this.lastArgs)
            this.lastArgs = null
        }
    }

    /**
     * Cancel any pending execution.
     */
    cancel(): void {
        if (this.timer != null) {
            clearTimeout(this.timer)
            this.timer = null
        }
        this.lastArgs = null
    }
}