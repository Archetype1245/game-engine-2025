class PolygonCollider extends Component {
    name = "PolygonCollider"
    points = []
    fillStyle = "magenta"
    fill = true
    strokeStyle = null
    lineWidth = 1
    hidden = false

    draw(ctx) {
        if (this.hidden || this.points.length < 2) return

        const { position: p, rotation: r, scale: s } = this.transform

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(r)
        ctx.scale(s.x, s.y)

        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y)
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y)
        }
        ctx.closePath()
        if (this.fill) {
            ctx.fillStyle = this.fillStyle
            ctx.fill()
        }

        if (this.strokeStyle) {
            ctx.strokeStyle = this.strokeStyle
            ctx.lineWidth = this.lineWidth / s.x
            ctx.miterLimit = 2
            ctx.stroke()
        }

        ctx.restore()
    }
}