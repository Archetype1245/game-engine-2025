class Polygon extends Component {
    name = "Polygon"
    points = []
    fillStyle = "magenta"
    fill = true
    strokeStyle = null
    lineWidth = 1
    hidden = false

    draw(ctx) {
        if (this.hidden) return
        ctx.fillStyle = this.fillStyle
        ctx.lineWidth = this.lineWidth
        ctx.strokeStyle = this.strokeStyle

        const p = this.transform.position;
        const s = this.transform.scale
        const r = this.transform.rotation

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(r)

        ctx.beginPath()
        ctx.moveTo(this.points[0].x * s.x, this.points[0].y * s.y)
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x * s.x, this.points[i].y * s.y)
        }
        ctx.closePath()
        if (this.fill) ctx.fill()
        if (ctx.strokeStyle) ctx.stroke()
        
        ctx.restore()
    }
}