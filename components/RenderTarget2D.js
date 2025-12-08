/**
 * RenderTarget2D - A reusable engine component for offscreen/cached procedural rendering.
 * Owns its own OffscreenCanvas, only re-renders when marked dirty.
 * Draws the cached buffer to the main canvas with configurable anchor, alpha, and shadow.
 */
class RenderTarget2D extends Component {
    constructor({
        width = 64,
        height = 64,
        renderFn = null,            // (ctxOS, w, h) => void
        anchorX = 0,                // 0..1, 0 = left edge at origin, 0.5 = centered
        anchorY = 0.5,              // 0..1, 0 = top edge at origin, 0.5 = centered
        alpha = 1.0,
        shadowColor = null,
        shadowBlur = 0,
        hidden = false,
    } = {}) {
        super()

        this._width = Math.max(1, Math.floor(width))
        this._height = Math.max(1, Math.floor(height))
        this.renderFn = renderFn
        this.anchorX = anchorX
        this.anchorY = anchorY
        this.alpha = alpha
        this.shadowColor = shadowColor
        this.shadowBlur = shadowBlur
        this.hidden = hidden

        this._canvas = new OffscreenCanvas(this._width, this._height)
        this._ctx = this._canvas.getContext("2d")
        this._dirty = true
    }

    get width() {
        return this._width
    }

    get height() {
        return this._height
    }

    get canvas() {
        return this._canvas
    }

    get ctx() {
        return this._ctx
    }

    /**
     * Resize the offscreen canvas. Only reallocates if dimensions actually changed.
     * @returns {boolean} True if resize occurred
     */
    setSize(w, h) {
        w = Math.max(1, Math.floor(w))
        h = Math.max(1, Math.floor(h))

        if (w === this._width && h === this._height) {
            return false
        }

        this._width = w
        this._height = h
        this._canvas.width = w
        this._canvas.height = h
        this._dirty = true
        return true
    }

    markDirty() {
        this._dirty = true
    }

    isDirty() {
        return this._dirty
    }

    /**
     * Force immediate re-render of the offscreen buffer.
     */
    render() {
        if (!this.renderFn) return

        const ctxOS = this._ctx
        const w = this._width
        const h = this._height

        ctxOS.clearRect(0, 0, w, h)

        ctxOS.save()
        ctxOS.globalAlpha = 1
        ctxOS.globalCompositeOperation = "source-over"
        ctxOS.shadowColor = "transparent"
        ctxOS.shadowBlur = 0

        this.renderFn(ctxOS, w, h)

        ctxOS.restore()

        this._dirty = false
    }

    draw(ctx) {
        if (this.hidden || this.alpha <= 0) return

        if (this._dirty) {
            this.render()
        }

        ctx.save()

        ctx.globalAlpha *= this.alpha

        if (this.shadowColor && this.shadowBlur > 0) {
            ctx.shadowColor = this.shadowColor
            ctx.shadowBlur = this.shadowBlur
        }

        const drawX = -this.anchorX * this._width
        const drawY = -this.anchorY * this._height

        ctx.drawImage(this._canvas, drawX, drawY)

        ctx.restore()
    }

    destroy() {
        this._canvas = null
        this._ctx = null
        this.renderFn = null
    }
}