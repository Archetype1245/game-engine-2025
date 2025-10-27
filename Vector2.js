class Vector2 {
    x
    y
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    static get zero() { return new Vector2(0, 0) }
    static get one() { return new Vector2(1, 1) }
    
    static get left() { return new Vector2(-1, 0) }
    static get right() { return new Vector2(1, 0) }
    static get up() { return new Vector2(0, -1) }
    static get down() { return new Vector2(0, 1) }

    clone(){
        return new Vector2(this.x, this.y)
    }

    plusEquals(other) {
        this.x += other.x; this.y += other.y
        return this
    }
    plus(other) {
        return new Vector2(this.x + other.x, this.y + other.y)
    }

    minusEquals(other) {
        this.x -= other.x; this.y -= other.y
        return this
    }
    minus(other) {
        return new Vector2(this.x - other.x, this.y - other.y)
    }

    timesEquals(scalar) {
        this.x *= scalar, this.y *= scalar
        return this
    }
    times(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar)
    }
    
    scale(other) {
        return new Vector2(this.x * other.x, this.y * other.y)
    }

    dot(other) {
        return this.x * other.x + this.y * other.y
    }

    orthogonal() {
        return new Vector2(-this.y, this.x)
    }

    get magnitude() {
        return Math.hypot(this.x, this.y)
    }

    normalize() {
        if (this.magnitude < MathUtils.EPS) return Vector2.zero
        return this.times(1 / this.magnitude)
    }

    getDirectionVector(other) {
        return this.minus(other).normalize()
    }
    // Returns the sum of multiple Vector2 objects inside an array
    static sum(arr) {
        let sum = Vector2.zero
        arr.forEach(v2 => sum.plusEquals(v2))
        return sum
    }
    // Mutates a Vector2 in place
    setVec(x, y) {
        this.x = x; this.y = y
        return this
    }
}