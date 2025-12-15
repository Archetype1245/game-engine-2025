class ConstantDistribution {
    constructor(value) {
        this.value = value
    }
    sample() {
        return this.value
    }
}

class UniformDistribution {
    constructor(low, high, rng = Math.random) {
        this.low = low
        this.range = high - low
        this.rng = rng
    }
    sample() {
        return this.low + this.rng() * this.range
    }
}

class UniformIntDistribution {
    constructor(low, high, rng = Math.random) {
        this.low = low | 0
        this.high = high | 0
        this.rangeInclusive = this.high - this.low + 1
        this.rng = rng
    }
    sample() {
        return this.low + ((this.rng() * this.rangeInclusive) | 0)
    }
}

// Currently not in use anywhere
class UniformAngleDistribution {
    constructor(rng = Math.random) {
        this.rng = rng
    }
    sample() {
        return this.rng() * MathUtils.TAU
    }
}

class ConstantColorDistribution {
    constructor(r, g, b) {
        this.r = r
        this.g = g
        this.b = b
    }

    sampleInto(out = { r: 0, g: 0, b: 0 }) {
        out.r = this.r
        out.g = this.g
        out.b = this.b
        return out
    }

    sample() {
        const out = { r: 0, g: 0, b: 0 }
        return this.sampleInto(out)
    }
}

class UniformColorDistribution {
    constructor(r, g, b, r2, g2, b2, rng = Math.random) {
        this.r = r
        this.g = g
        this.b = b
        this.dr = r2 - r
        this.dg = g2 - g
        this.db = b2 - b
        this.rng = rng
    }

    sampleInto(out = { r: 0, g: 0, b: 0 }) {
        const t = this.rng()

        out.r = Math.round(this.r + t * this.dr)
        out.g = Math.round(this.g + t * this.dg)
        out.b = Math.round(this.b + t * this.db)
        return out
    }

    sample() {
        const out = { r: 0, g: 0, b: 0 }
        return this.sampleInto(out)
    }
}

class Particle {
    constructor() {
        this.color = { r: 255, g: 255, b: 255 }
    }

    reset(params = {}) {
        this.x = params.x ?? 0
        this.y = params.y ?? 0

        const dir = params.dir ?? 0
        this.speed = params.speed ?? 0

        this.dx = Math.cos(dir)
        this.dy = Math.sin(dir)
        this.vx = this.dx * this.speed
        this.vy = this.dy * this.speed

        this.lifetime = params.lifetime ?? 1
        this.age = 0
        this.size = params.size ?? 1
        this.startAlpha = params.startAlpha ?? 1
        this.endAlpha = params.endAlpha ?? 0
        this.isDead = false,

        this.maxLength = params.length ?? 0
        this.currentLength = 0

        // Reuse the existing color obj
        const colorDist = params.colorDist
        if (colorDist) {
            colorDist.sampleInto(this.color)
        } else {
            this.color.r = 255
            this.color.g = 255
            this.color.b = 255
        }

        // rgb instead of rgba to reduce the number of string builds
        // can set globalAlpha once per burst draw instead of building N strings (since alpha is more likely to fade over time)
        this.rgb = `rgb(${this.color.r},${this.color.g},${this.color.b})`
    }

    update(dt) {
        this.age += dt
        if (this.age >= this.lifetime) {
            this.isDead = true
            return
        }

        this.x += this.vx * dt
        this.y += this.vy * dt

        const traveled = this.speed * this.age
        this.currentLength = Math.min(this.maxLength, traveled)
    }

    getAlpha() {
        const t = MathUtils.clamp01(this.age / this.lifetime)
        return this.startAlpha + (this.endAlpha - this.startAlpha) * t
    }
}

class ParticleSystem {
    constructor({ composite = "source-over", maxPool = 2000 } = {}) {
        this.composite = composite
        this.maxPool = maxPool
        this.particles = []
        this.pool = []
    }

    _getParticle() {
        return this.pool.pop() ?? new Particle()
    }

    _recycle(p) {
        if (this.pool.length < this.maxPool) {
            this.pool.push(p)
        }
    }

    burst(x, y, preset, baseDir = null, spread = null) {
        const n = preset.count.sample() | 0
        if (n <= 0) return

        // Spread will usually be tied to direction, but might also be nice to preset;
        // If direction isn't a uniform circle distribution, it'll likely change per burst
        const s = spread ?? preset.spread
        const useCone = (baseDir != null) && (s != null)

        for (let i = 0; i < n; i++) {
            const p = this._getParticle()

            const dir = useCone
                ? baseDir + (Math.random() - 0.5) * s
                : Math.random() * MathUtils.TAU

            p.reset({
                x,
                y,
                dir,
                speed: preset.speed.sample(),
                lifetime: preset.lifetime.sample(),
                size: preset.size.sample(),
                startAlpha: preset.startAlpha ?? 1,
                endAlpha: preset.endAlpha ?? 0,
                colorDist: preset.color,
                length: preset.length ? preset.length.sample() : 0
            })

            this.particles.push(p)
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]
            p.update(dt)

            // If particle is dead, swap final particle into this one's position,
            // remove the (now duplicate) final particle, and recycle it for reuse.
            if (p.isDead) {
                const last = this.particles.length - 1
                this.particles[i] = this.particles[last]
                this.particles.pop()
                this._recycle(p)
            }
        }
    }

    draw(ctx) {
        if (this.particles.length === 0) return

        ctx.save()
        ctx.globalCompositeOperation = this.composite

        for (const p of this.particles) {
            ctx.globalAlpha = p.getAlpha()
            
            if (p.dx !== 0 || p.dy !== 0) {
                // Draw line/streak
                ctx.strokeStyle = p.rgb
                ctx.lineWidth = p.size
                ctx.beginPath()
                ctx.moveTo(p.x - p.dx * p.currentLength, p.y - p.dy * p.currentLength)
                ctx.lineTo(p.x, p.y)
                ctx.stroke()
            } else {
                // Draw circle
                ctx.fillStyle = p.rgb
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, MathUtils.TAU)
                ctx.fill()
            }
        }
        ctx.restore()
    }
}

class ParticleFXController extends Component {
    constructor() {
        super()
        this.systems = new Map()
    }

    _system(systemName = "default", composite = "source-over") {
        const key = systemName
        let s = this.systems.get(key)

        if (!s) {
            s = new ParticleSystem(composite)
            this.systems.set(key, s)
        }
        return s
    }

    burst(x, y, preset, baseDir = null, spread = null) {
        const systemName = preset.system ?? "default"
        const composite = preset.composite ?? "source-over"

        this._system(systemName, composite).burst(x, y, preset, baseDir, spread)
    }

    update(dt) {
        for (const s of this.systems.values()) {
            s.update(dt)
        }
    }

    draw(ctx) {
        for (const s of this.systems.values()) {
            s.draw(ctx)
        }
    }
}