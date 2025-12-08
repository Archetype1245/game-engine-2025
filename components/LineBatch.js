class LineBatch extends Component {
    name = "LineBatch"

    // Array of { a: Vector2, b: Vector2, data?: any }
    segments = []

    // Can be a constant (string/CanvasGradient) or function (ctx, seg, i) => style
    strokeStyle = "white"
    lineWidth = 2

    // true = one Path2D + one stroke(); false = per-segment styling
    batched = true
    hidden = false

    _path2d = null
    _dirtyPath = true

    get path2d() {
        if (this._dirtyPath || !this._path2d) {
            const p = new Path2D()
            for (const seg of this.segments) {
                p.moveTo(seg.a.x, seg.a.y)
                p.lineTo(seg.b.x, seg.b.y)
            }
            this._path2d = p
            this._dirtyPath = false
        }
        return this._path2d
    }

    markDirty() {
        this._dirtyPath = true
    }

    _resolveStyle(ctx, seg, index) {
        return typeof this.strokeStyle === 'function'
            ? this.strokeStyle(ctx, seg, index)
            : this.strokeStyle
    }

    draw(ctx) {
        if (this.hidden || this.segments.length === 0) return

        ctx.save()
        ctx.lineWidth = this.lineWidth

        if (this.batched) {
            ctx.strokeStyle = this._resolveStyle(ctx, null, -1)
            ctx.stroke(this.path2d)
        } else {
            for (let i = 0; i < this.segments.length; i++) {
                const seg = this.segments[i]
                ctx.strokeStyle = this._resolveStyle(ctx, seg, i)
                ctx.beginPath()
                ctx.moveTo(seg.a.x, seg.a.y)
                ctx.lineTo(seg.b.x, seg.b.y)
                ctx.stroke()
            }
        }
        ctx.restore()
    }
}