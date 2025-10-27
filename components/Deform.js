class Deform extends Component {
    constructor() {
        super()
        this.u = new Vector2(1, 0)
        this.v = new Vector2(0, 1)
        this.c = Vector2.zero

        this.su = 1
        this.sv = 1

        this._M = Mat2D.identity
        this._dirty = true
    }

    setBasisAndCenter(u, v, c) {
        this.u.setVec(u.x, u.y)
        this.v.setVec(v.x, v.y)
        this.c.setVec(c.x, c.y)
        this._dirty = true
    }

    setScaleUV(su, sv) {
        if (this.su !== su || this.sv !== sv) {
            this.su = su
            this.sv = sv
            this._dirty = true
        }
    }

    getMatrix() {
        if (!this._dirty) return this._M

        const u = this.u, v = this.v, centroid = this.c
        const su = this.su, sv = this.sv

        const det = u.x*v.y - u.y*v.x
        if (!Number.isFinite(det) || Math.abs(det) < MathUtils.EPS) {
            console.warn("Degenerate deform attempt", u, v)
            this._dirty = false
            return Mat2D.identity
        }

        // Create the inverse of the 2x2 matrix obtained from the basis vectors
        const invDet = 1 / det
        const mInv = { a:  v.y * invDet,
                       b: -u.y * invDet,
                       c: -v.x * invDet,
                       d:  u.x * invDet
        }

        // Create the 2x2 matrix consisting of the basis vectors scaled by su and sv
        const mS = { a: u.x * su,
                     b: u.y * su,
                     c: v.x * sv,
                     d: v.y * sv
        }

        // mS * mInv
        const m = Mat2D.matrix2X2Multiply(mS, mInv)
        const offset = Mat2D.applyRSToPoint(m, centroid)
        const t = centroid.minus(offset)

        const M = this._M
        M.a  = m.a
        M.b  = m.b
        M.c  = m.c
        M.d  = m.d
        M.tx = t.x
        M.ty = t.y

        this._dirty = false
        return M
    }
}