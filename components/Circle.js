class Circle extends Component {
    constructor({
        radius = 10,
        fillStyle = "#ffffff",
        fill = true,
        strokeStyle = null,
        lineWidth = 1,
        shadowColor = null,
        shadowBlur = 0,
        hidden = false,
        alpha = 1.0,
    } = {}) {
        super()
        this.radius = radius
        this.fillStyle = fillStyle
        this.fill = fill
        this.strokeStyle = strokeStyle
        this.lineWidth = lineWidth
        this.shadowColor = shadowColor
        this.shadowBlur = shadowBlur
        this.hidden = hidden
        this.alpha = alpha
    }

    draw(ctx) {
        if (this.hidden || this.radius <= 0 || this.alpha <= 0) return

        ctx.save()
        ctx.globalAlpha *= this.alpha

        if (this.shadowColor && this.shadowBlur > 0) {
            ctx.shadowColor = this.shadowColor
            ctx.shadowBlur = this.shadowBlur
        }

        let resolvedFillStyle = this.fillStyle
        if (typeof this.fillStyle === "function") {
            resolvedFillStyle = this.fillStyle(ctx, this.radius)
        }

        ctx.beginPath()
        ctx.arc(0, 0, this.radius, 0, MathUtils.TAU)

        if (this.fill && resolvedFillStyle) {
            ctx.fillStyle = resolvedFillStyle
            ctx.fill()
        }

        if (this.strokeStyle) {
            ctx.strokeStyle = this.strokeStyle
            ctx.lineWidth = this.lineWidth
            ctx.stroke()
        }

        ctx.restore()
    }
}