class AnimationManager {
    transitions = new Set()

    add(t) {
        this.transitions.add(t)
        return t
    }

    update(dt) {
        for (const t of this.transitions) {
            t.update(dt)

            if (t.done) this.transitions.delete(t)
        }
    }
}


class Transition {
    constructor({ from=0, to=1, duration, delay=0, lerp=(a, b, t) => a + (b - a) * t, onUpdate, onComplete }) {
        this.from = from
        this.to = to
        this.duration = duration
        this.delay = delay
        this.lerp = lerp               // default to a basic straight-line "a-to-b" animation path
        this.onUpdate = onUpdate
        this.onComplete = onComplete   // might be useful? though, most instances would likely be clearer with a `.then(() => {...})` call
        this.elapsed = 0
        this.done = false

        this.promise = new Promise(resolve => { this.resolve = resolve })
    }

    update(dt) {
        if (this.done) return

        this.elapsed += dt
        if (this.elapsed < this.delay) return


        const t = Math.min(1, (this.elapsed - this.delay) / this.duration)  // Normalized (0-1)
        const val = this.lerp(this.from, this.to, t)
        this.onUpdate(val, t)

        if (t >= 1) {
            // Transition is complete - set to done and call the onComplete function (if one was given)
            this.done = true
            this.resolve()
            this.onComplete?.()
        }
    }
    // Make it await-able
    then(resolve, reject) {
        return this.promise.then(resolve, reject)
    }
}