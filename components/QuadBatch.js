class QuadBatch extends Component {
    name = "QuadBatch"

    cells = [] // Array { tl, tr, br, bl, cellIdx }

    posX = null
    posY = null

    fillStyle = "magenta"

    hidden = false

    _resolveStyle(ctx, cell, index) {
        return typeof this.fillStyle === 'function'
            ? this.fillStyle(ctx, cell, index)
            : this.fillStyle
    }

    draw(ctx) {
        if (this.hidden || this.cells.length === 0) return
        if (!this.posX || !this.posY) return

        const posX = this.posX
        const posY = this.posY

        ctx.save()
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i]
            const style = this._resolveStyle(ctx, cell, i)

            if (!style) continue

            ctx.fillStyle = style
            ctx.beginPath()
            ctx.moveTo(posX[cell.tl], posY[cell.tl])
            ctx.lineTo(posX[cell.tr], posY[cell.tr])
            ctx.lineTo(posX[cell.br], posY[cell.br])
            ctx.lineTo(posX[cell.bl], posY[cell.bl])
            ctx.closePath()
            ctx.fill()
        }
        ctx.restore()
    }
}