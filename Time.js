class Time {
    static time = 0
    static unscaledTime = 0
    static deltaTime = 0
    static unscaledDeltaTime = 0

    static scale = {
        world: 1,
        background: 1,
        fx: 1,
        ui: 1,
        unscaled: 1
    }

    static paused = false

    static dt = {
        world: 0,
        background: 0,
        fx: 0,
        ui: 0,
        pausable: 0,
        unscaled: 0
    }

    static _last = 0
    static _timers = []

    static update(nowMS) {
        const now = nowMS * 0.001
        if (!this._last) this._last = now

        let raw = now - this._last
        this._last = now

        this.unscaledDeltaTime = raw
        this.unscaledTime += raw

        const pauseMult = this.paused ? 0 : 1

        this.dt.unscaled = raw
        this.dt.world = raw * this.scale.world
        this.dt.background = raw * this.scale.background
        this.dt.fx = raw * this.scale.fx
        this.dt.ui = raw * this.scale.ui
        this.dt.pausable = raw * pauseMult

        this._updateTimers()

        // Keeping for now until refactor is finished
        this.deltaTime = this.dt.world
        this.time += this.dt.world
    }


    static _updateTimers() {
        if (this._timers.length === 0) return

        for (let i = this._timers.length - 1; i >= 0; i--) {
            const t = this._timers[i]
            if (t.done) {
                this._timers.splice(i, 1)
                continue
            }

            const dt = this.dt[t.clock] ?? 0
            if (dt <= 0) continue

            t.remaining -= dt
            if (t.remaining <= 0) {
                t.done = true
                this._timers.splice(i, 1)
                t.callback?.()
            }
        }
    }

    static after(seconds, callback, clock = "unscaled") {
        const t = {
            remaining: seconds,
            callback,
            clock,
            done: false
        }

        this._timers.push(t)

        return {
            cancel: () => { t.done = true },
            getRemaining: () => t.remaining
        }
    }

    static clearTimers() {
        this._timers.length = 0
    }

    static afterWorld(seconds, callback)    { return this.after(seconds, callback, "world") }
    static afterUnscaled(seconds, callback) { return this.after(seconds, callback, "unscaled") }
    static afterPausable(seconds, callback) { return this.after(seconds, callback, "pausable") }
}