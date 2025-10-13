class Polygon extends Component {
    name = "Polygon"
    points = []
    fillStyle = "magenta"
    fill = true
    strokeStyle = null
    lineWidth = 1
    hidden = false

    _path2d = null
    _centroid = null
    _avgNormal = null
    _dirtyPath = true

    get path2d() {
        if (this._dirtyPath || !this._path2d) {
            const p = new Path2D()

            if (Array.isArray(this.points[0])) {
                for (const subPoly of this.points) this.createPath(subPoly, p)
            } else {
                this.createPath(this.points, p)
            }

            this._path2d = p
            this._dirtyPath = false
        }
        return this._path2d
    }

    markDirty() {
        this._dirtyPath = true
    }

    createPath(pts, p) {
        if (!pts || pts.length === 0) return

        p.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) {
            p.lineTo(pts[i].x, pts[i].y)
        }
        p.closePath()
    }

    draw(ctx) {
        if (this.hidden || this.points.length < 2) return

        const { position: p, rotation: r, scale: s } = this.transform

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(r)
        ctx.scale(s.x, s.y)

        const path = this.path2d

        if (this.fill) {
            ctx.fillStyle = this.fillStyle
            ctx.fill(path)
        }

        if (this.strokeStyle) {
            ctx.strokeStyle = this.strokeStyle
            ctx.lineWidth = this.lineWidth / s.x
            ctx.miterLimit = 2
            ctx.stroke(path)
        }
        ctx.restore()
    }
}