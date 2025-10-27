class PolygonCollider extends Component {
    name = "PolygonCollider"
    points = []
    _worldPoints = []
    _aabb =  { min: {x:0, y:0}, max: {x:0, y:0} }
    _radius = 0
    _center = Vector2.zero

    _dirty = true
    _lastTransformVersion = -1


    markDirty() {
        this._dirty = true
    }

    _ensureUpdated() {
        const t = this.transform
        const deform = this.gameObject.getComponent(Deform)
        const needsUpdate = this._dirty ||
                            this._lastTransformVersion !== t.worldVersion ||
                            (deform && deform._dirty)
        if (!needsUpdate) return

        // Otherwise... update world points
        const W = t.worldMatrix
        const D = deform?.getMatrix()
        const M = D ? Mat2D.matrix2dMultiply(W, D) : W
        this._worldPoints = this.points.map(p => Mat2D.applyMatrixToPoint(M, p))

        // Update aabb
        let minX =  Infinity, minY =  Infinity
        let maxX = -Infinity, maxY = -Infinity
        for (let i = 0; i < this._worldPoints.length; i++) {
            const p = this._worldPoints[i]
            if (p.x < minX) minX = p.x;  if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x;  if (p.y > maxY) maxY = p.y
        }
        this._aabb.min.x = minX;  this._aabb.min.y = minY
        this._aabb.max.x = maxX;  this._aabb.max.y = maxY

        this._center.setVec((minX + maxX)*0.5, (minY + maxY)*0.5)
        this._radius = Math.hypot((maxX - minX)*0.5, (maxY - minY)*0.5)

        this._lastTransformVersion = t.worldVersion
        this._dirty = false
    }

    get worldPoints() {
        this._ensureUpdated()
        return this._worldPoints
    }

    get aabb() {
        this._ensureUpdated()
        return this._aabb
    }

    get radius() {
        this._ensureUpdated()
        return this._radius
    }

    get center() {
        this._ensureUpdated()
        return this._center
    }
}