class Polygon extends Component {
    name = "Polygon"
    points = []
    fillStyle = "magenta"
    fill = true
    strokeStyle = null
    lineWidth = 1
    closePath = true
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
        if (this.closePath) p.closePath()
    }

    draw(ctx) {
        if (this.hidden || this.points.length < 2) return

        const path = this.path2d
        if (this.fill) {
            ctx.fillStyle = this.fillStyle
            ctx.fill(path)
        }
        
        if (this.strokeStyle) {
            const s = Math.abs(this.transform.scale.x)
            ctx.strokeStyle = this.strokeStyle
            ctx.lineWidth = this.lineWidth / s
            ctx.miterLimit = 2
            ctx.stroke(path)
        }
    }
}