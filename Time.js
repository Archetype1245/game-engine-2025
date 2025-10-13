class Time {
    // More closely matches deltaTime rather than fixedDeltaTime
    static lastFrame = performance.now()
    static deltaTime = 0

    static update() {
        const now = performance.now()
        Time.deltaTime = (now - Time.lastFrame) / 1000
        Time.lastFrame = now
    }

    static get time() {
        return performance.now() / 1000
    }
}