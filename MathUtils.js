class MathUtils {
    static INV_SQRT2 = 1 / Math.SQRT2
    static EPS = 1e-3

    static clamp(v, min, max) {
        return v < min ? min
            : v > max ? max

                : v
    }
    static clamp01(v) {
        return v < 0 ? 0
            : v > 1 ? 1
                : v
    }

    static dot(ax, ay, bx, by) {
        return (ax * bx + ay * by)
    }

    static cross(u, v) {
        return u.x * v.y - u.y * v.x
    }

    static getCentroid(points) {
        return Vector2.sum(points).times(1 / points.length)
    }

    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    static mod(n, m) {
        return ((n % m) + m) % m
    }
}