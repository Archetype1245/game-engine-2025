class SweptCircle extends Component {
    radius = 0
    _prev = Vector2.zero

    capturePrev() {
        const p = this.gameObject.transform._position
        this._prev.setVec(p.x, p.y)
    }

    get prevPos() { return this._prev }
    get r() { return this.radius }
}