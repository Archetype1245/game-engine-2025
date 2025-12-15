class AnimationManager {
    transitions = new Set()

    add(t) {
        this.transitions.add(t)
        return t
    }

    update() {
        for (const t of this.transitions) {
            const dt = Time.dt[t.clock]
            t.update(dt)

            if (t.done) this.transitions.delete(t)
        }
    }

    clear() {
        this.transitions.clear()
    }
}

class Transition {
    constructor({
        from = 0,
        to = 1,
        duration,
        delay = 0,
        easing = (t) => t,
        lerp = (a, b, t) => a + (b - a) * t,
        clock = "pausable",
        onUpdate,
        onComplete
    }) {
        this.from = from
        this.to = to
        this.duration = duration
        this.delay = delay
        this.easing = easing
        this.lerp = lerp               // default to a basic straight-line "a-to-b" animation path
        this.onUpdate = onUpdate
        this.onComplete = onComplete   // might be useful? though, most instances would likely be clearer with a `.then(() => {...})` call
        this.elapsed = 0
        this.clock = clock
        this.done = false

        this.promise = new Promise(resolve => { this.resolve = resolve })
    }

    update(dt) {
        if (this.done) return

        this.elapsed += dt
        if (this.elapsed < this.delay) return

        const t = Math.min(1, (this.elapsed - this.delay) / this.duration)  // Normalized (0-1)
        const u = this.easing(t)
        const val = this.lerp(this.from, this.to, u)
        this.onUpdate?.(val, u)

        if (t >= 1) {
            // Transition is complete - set to done and call the onComplete function (if one was given)
            this.done = true
            this.resolve()
            this.onComplete?.()
        }
    }

    cancel() {
        if (this.done) return
        this.done = true

        this.resolve?.()
    }

    // Make it await-able
    then(resolve, reject) {
        return this.promise.then(resolve, reject)
    }
}

class CancelToken {
    constructor() {
        this.cancelled = false
    }

    cancel() {
        this.cancelled = true
    }
}