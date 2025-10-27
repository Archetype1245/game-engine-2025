class Text extends Component {
    fillStyle = "magenta"
    text = "[NO TEXT]"
    font = "24px 'Comic Sans MS'"
    textAlign = "center"
    textBaseline = "middle"

    glow = false
    glowConfig = {
        color: "magenta",
        blur: 12,
        offsetX: 0,
        offsetY: 0,
        alpha: 1
    }

    outline = false
    outlineConfig = {
        color: "black",
        width: 2,
        lineJoin: "round",
        miterLimit: 2,
        alpha: 1
    }


    draw(ctx) {
        if (!this.text) return

        const s = Math.abs(this.transform.scale.x)
        ctx.font = this.font
        ctx.textAlign = this.textAlign
        ctx.textBaseLine = this.textBaseline

        if (this.glow) {
            const { color, blur, offsetX, offsetY, alpha } = this.glowConfig

            ctx.save()
            ctx.shadowBlur = blur / s
            ctx.shadowColor = color
            ctx.shadowOffsetX = offsetX / s
            ctx.shadowOffsetY = offsetY / s
            ctx.globalAlpha *= alpha
            ctx.fillText(this.text, 0, 0)
            ctx.restore()
        }

        ctx.fillStyle = this.fillStyle
        ctx.fillText(this.text, 0, 0)

        if (this.outline) {
            const {color, width, lineJoin, miterLimit, alpha } = this.outlineConfig

            ctx.save()
            ctx.strokeStyle = color
            ctx.lineWidth = width / s
            ctx.lineJoin = lineJoin
            ctx.miterLimit = miterLimit
            ctx.globalAlpha *= alpha
            ctx.strokeText(this.text, 0, 0)
            ctx.restore()
        }
    }
}