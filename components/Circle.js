class Circle extends Component {
    r = 1
    startAngle = 0
    endAngle = 2 * Math.PI
    fillStyle = "magenta"
    strokeStyle = "black"
    lineWidth = 1
    hidden = false
    
    draw(ctx) {
        if (this.hidden) return
        const pos = this.transform.position
        const scale = this.transform.scale

        ctx.fillStyle = this.fillStyle  
        ctx.lineWidth = this.lineWidth
        ctx.strokeStyle = this.strokeStyle

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, this.r * scale.x, this.startAngle, this.endAngle)
        ctx.closePath()
        ctx.fill()
    }
}