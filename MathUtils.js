class MathUtils {
    static INV_SQRT2 = 1 / Math.SQRT2
    static EPS = 1e-3
    static TAU = 2 * Math.PI

    static clamp(v, min, max) {
        if (v < min) return min
        if (v > max) return max
        return v
    }

    static clamp01(v) {
        if (v < 0) return 0
        if (v > 1) return 1
        return v
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

    static lerpAngle(current, target, t) {
        const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current))
        return current + delta * t
    }

    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    static mod(n, m) {
        return ((n % m) + m) % m
    }
}