class Time {
    // More closely matches deltaTime rather than fixedDeltaTime
    static lastFrame = performance.now()
    static deltaTime = 0

    static update() {
        const now = performance.now()
        Time.deltaTime = (now - Time.lastFrame)  // Kept dt in ms
        Time.lastFrame = now
    }
}