class MathUtils {
    static INV_SQRT2 = 1 / Math.SQRT2

    static clamp(v, min, max) {
        return v < min ? min
            : v > max ? max
                : v
    }

    static getCentroid(points) {
        return Vector2.sum(points).times(1 / points.length)
    }
}