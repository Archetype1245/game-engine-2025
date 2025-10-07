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
        this.x += other.x
        this.y += other.y
    }

    plus(other) {
        return new Vector2(this.x + other.x, this.y + other.y)
    }

    minus(other) {
        return new Vector2(this.x - other.x, this.y - other.y)
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
}