class Transform extends Component {
    constructor() {
        super()
        this._position = Vector2.zero
        this._rotation = 0
        this._scale = Vector2.one

        this.parent = null
        this.children = []
        /*
         *      Transformation Matrix:
         *
         *          [ a  c  tx ]
         *          [ b  d  ty ]
         *          [ 0  0   1 ]
         * 
         * (a, b)   -> what some transformation did to the local x-axis (î)
         * (c, d)   -> what some transformation did to the local y-axis (ĵ)
         * (tx, ty) -> where some transformation moved the 'origin' (where it got 'translated' to)
         */
        this.local = Mat2D.identity
        this.world = Mat2D.identity
        this.worldInv = Mat2D.identity

        this._dirtyLocal = true
        this._dirtyWorld = true
    }

    get position() { return new Vector2(this._position.x, this._position.y) }
    set position(v) {
        this._position.x = v.x
        this._position.y = v.y
        this._dirtyLocal = this._dirtyWorld = true
    }

    get rotation() { return this._rotation }
    set rotation(r) {
        this._rotation = r
        this._dirtyLocal = this._dirtyWorld = true
    }

    get scale() { return new Vector2(this._scale.x, this._scale.y) }
    set scale(s) {
        this._scale.x = s.x
        this._scale.y = s.y
        this._dirtyLocal = this._dirtyWorld = true
    }

    get worldPosition() {
        this._updateWorld()
        return new Vector2(this.world.tx, this.world.ty)
    }
    set worldPosition(v) {
        this._updateWorld()
        if (!this.parent) {
            this.position = new Vector2(v.x, v.y)
        } else {
            /*
             *  If we have some world matrix (W) and some local matrix L, then multiplying by the local origin
             *  L * (0,0,1) gives us the "translation" (tx, ty, 1) of that local matrix.
             *  We want to set (tx, ty, 1) such that some world vector `v` (vx, vy, 1) = W * (tx, ty, 1).
             *  Since we're solving for (tx, ty, 1), we need to multiply both sides by the inverse of W;
             *  W_inv * (vx, vy, 1) = (tx, ty, 1)
             */
            this.parent._updateWorld()
            const M = this.parent.worldInv
            const localX = M.a * v.x + M.c * v.y + M.tx
            const localY = M.b * v.x + M.d * v.y + M.ty
            this.position = new Vector2(localX, localY)
        }
    }

    get worldInverse() {
        // Used in cam
        this._updateWorld()
        return this.worldInv
    }

    get worldMatrix() {
        this._updateWorld()
        return this.world
    }

    get worldRotation() {
        this._updateWorld()
        return Math.atan2(this.world.b, this.world.a)       // Just calculating the angle of post-world-transformation î
    }
    set worldRotation(r) {
        // Pass
    }

    get worldScale() {
        this._updateWorld()
        const sx = Math.hypot(this.world.a, this.world.b)   // Magnitude/length of post-world-transformation î
        const sy = Math.hypot(this.world.c, this.world.d)   // Magnitude/length of post-world-transformation ĵ
        return new Vector2(sx, sy)
    }
    set worldScale(s) {
        // Pass
    }

    setPosition(x, y) { this.position = { x, y } }
    setRotation(r) {
        if (r > 1000 || r < -1000) {
            r = (r + Math.PI) % (2*Math.PI)
            r <= 0 ? r + Math.PI : r - Math.PI
        }
        this.rotation = r
    }
    setScale(sx, sy) { this.scale = new Vector2(sx, sy) }
    setUniformScale(s) { this.scale = new Vector2(s, s)}

    translate(dx, dy) { this.setPosition(this.position.x + dx, this.position.y + dy) }
    rotate(r) { this.setRotation(this.rotation + r) }
    scaleBy(sx, sy) { this.setScale(this.scale.x * sx, this.scale.y * sy) }

    _updateLocal() {
        if (!this._dirtyLocal) return

        const t = this.position
        const r = this.rotation
        const s = this.scale

        this.local = Mat2D.matrixFromTRS(t, r, s)
        this._dirtyLocal = false
        this._dirtyWorld = true
    }

    _updateWorld() {
        this._updateLocal()
        if (!this._dirtyWorld) return

        if (!this.parent) {
            this.world = { ...this.local }
        } else {
            this.parent._updateWorld()
            this.world = Mat2D.matrix2dMultiply(this.parent.world, this.local)
        }
        this.worldInv = Mat2D.invMatrix(this.world)
    }

    setParent(newParent, keepWorldPos = true) {
        const p = this.position
        const r = this.rotation
        const s = this.scale

        if (this.parent) {
            const children = this.parent.children
            const idx = children.indexOf(this)
            if (idx !== -1) children.splice(idx, 1)      // Remove current transform from original parent's list of children
        }

        this.parent = newParent
        if (newParent) newParent.children.push(this)     // Add current transform to new parent's list of children

        if (keepWorldPos) {
            // Update transform's local values according to the new parent's position
            this.rotation = r
            this.scale = s
            this.position = p
        }
    }
}