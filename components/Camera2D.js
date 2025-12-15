class Camera2D extends Component {
    constructor({ backgroundColor="black", aspect=16/9, viewWidth=16, viewHeight=9, zoom=1 } = {}) {
        super()
        this.backgroundColor = backgroundColor
        this.aspect = aspect
        this.viewWidth = viewWidth
        this.viewHeight = viewHeight
        this.zoom = zoom
        this._recomputeEffective()
    }

    static get main() {
        return GameObject.getObjectByName("CameraGameObject")
    }

    setZoom(z) {
        this.zoom = z
        this._recomputeEffective()
    }

    setView({ width, height, aspect=this.aspect }) {
        this.aspect = aspect
        if (width && !height) height = width / aspect
        if (height && !width) width = height * aspect
        this.viewWidth = width
        this.viewHeight = height
        this._recomputeEffective()
    }

    _recomputeEffective() {
        // Update effective width and height
        const z = Math.max(0.001, this.zoom)    // Just guarding against division by zero
        this.effW = this.viewWidth / z
        this.effH = this.viewHeight / z
    }
    
    scaleRatio(cnv) {
        // Take the smaller ratio and potentially letterbox the other
        const xRatio = cnv.width / this.effW
        const yRatio = cnv.height / this.effH
        return Math.min(xRatio, yRatio)
    }

    getScreenMatrix() {
        const cnv = Engine.canvas
        const ratio = this.scaleRatio(cnv)

        const V = this.transform.worldInverse                      // Matrix to convert from world -> camera
        const S = Mat2D.scale(ratio)                               // Matrix to scale by the calculated ratio
        const C = Mat2D.translate(cnv.width / 2, cnv.height / 2)   // Matrix to translate to canvas center

        // Screen transform -> C * S * V
        const SV = Mat2D.matrix2dMultiply(S, V)
        return Mat2D.matrix2dMultiply(C, SV)
    }

    screenPointToWorld(p) {
        const M = Mat2D.invMatrix(this.getScreenMatrix())
        return Mat2D.applyMatrixToPoint(M, p)
    }

    getCanvasWorldExtent(cnv = Engine.canvas) {
        const ratio = this.scaleRatio(cnv)
        return { width: cnv.width / ratio, height: cnv.height / ratio }
    }

    getVisibleWorldSize() {
        return { width: this.effW, height: this.effH}
    }

    getViewportRect(cnv = Engine.canvas) {
        const ratio = this.scaleRatio(cnv)
        const viewPixelWidth = this.effW * ratio
        const viewPixelHeight = this.effH * ratio
        const vx = (cnv.width - viewPixelWidth) / 2
        const vy = (cnv.height - viewPixelHeight) / 2

        return { x: vx, y: vy, width: viewPixelWidth, height: viewPixelHeight }
    }
}