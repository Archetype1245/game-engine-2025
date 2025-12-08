/**
 * Circle - A reusable engine draw component for rendering circles.
 * Supports solid fills, gradient fills (via function), and optional stroke/glow.
 * Draws in local space at the GameObject's origin, respecting transform.
 */
class Circle extends Component {
    constructor({
        radius = 10,
        fillStyle = "#ffffff",      // string | CanvasGradient | (ctx, radius) => style
        fill = true,
        strokeStyle = null,
        lineWidth = 1,
        shadowColor = null,
        shadowBlur = 0,
        hidden = false,
        alpha = 1.0,
    } = {}) {
        super()
        Object.assign(this, {
            radius,
            fillStyle,
            fill,
            strokeStyle,
            lineWidth,
            shadowColor,
            shadowBlur,
            hidden,
            alpha,
        })
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
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2)

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