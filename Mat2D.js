class Mat2D {
    // Returns the identity matrix, where î and ĵ are their default values (no scale/rotation), with no translation
    static get identity() { return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 } }

    // Returns a transform matrix that holds info to translate by (x,y)
    static translate(x, y) { return { a: 1, b: 0, c: 0, d: 1, tx: x, ty: y } }

    // Returns a transform matrix that holds info to scale by (sx, sy)
    static scale(sx, sy = sx) { return { a: sx, b: 0, c: 0, d: sy, tx: 0, ty: 0 } }

    // Returns a transform matrix that holds info to rotate by `r`
    static rotate(r) {
        const c = Math.cos(r)
        const s = Math.sin(r)
        return { a: c, b: s, c: -s, d: c, tx: 0, ty: 0 }
    }

    // Given a translation, rotation, and scale, returns a 2D matrix encoding the info
    static matrixFromTRS(t, r, s) {
        const cos = Math.cos(r)
        const sin = Math.sin(r)

        const a = cos * s.x
        const b = sin * s.x
        const c = -sin * s.y
        const d = cos * s.y
        const tx = t.x
        const ty = t.y

        return { a, b, c, d, tx, ty }
    }

    static matrix2dMultiply(/*parent=*/m1, /*child=*/m2) {
        /* 
         * The resultant matrix gives the following information:
         * (a, b)   -> where the local x-axis lands in parent space (î)
         * (c, d)   -> where the local y-axis lands in parent space (ĵ)
         * (tx, ty) -> where the 'origin' lands in parent space (is translated to)
         *
         * Recursively calling this via will ultimately provide world space transformation for the child transform
         */
        return {
            a:  m1.a * m2.a  + m1.c * m2.b,
            b:  m1.b * m2.a  + m1.d * m2.b,
            c:  m1.a * m2.c  + m1.c * m2.d,
            d:  m1.b * m2.c  + m1.d * m2.d,
            tx: m1.a * m2.tx + m1.c * m2.ty + m1.tx,
            ty: m1.b * m2.tx + m1.d * m2.ty + m1.ty
        }
    }

    static matrix2X2Multiply(m1, m2) {
        return {
            a: m1.a * m2.a + m1.c * m2.b,
            b: m1.b * m2.a + m1.d * m2.b,
            c: m1.a * m2.c + m1.c * m2.d,
            d: m1.b * m2.c + m1.d * m2.d,
        }
    }

    static invMatrix(m) {
        const det = m.a * m.d - m.b * m.c
        if (!Number.isFinite(det) || Math.abs(det) < MathUtils.EPS) {
            console.warn("Degenerate matrix inverse attempt", m)
            return Mat2D.identity
        }

        const invDet = 1 / det
        // { a,b,c,d } determines rotation and scale, and the inverse matrix negates the transformation's rotation/scale/reflection/shear/etc.
        // Inverting a 2x2 matrix like this is simply -> (1/det) * [[d, -c], [-b, a]]
        const a =  m.d * invDet
        const b = -m.b * invDet
        const c = -m.c * invDet
        const d =  m.a * invDet
        // Need to undo the rotation/scale/reflection/shear here as well, before trying to negate the transfomation's translation.
        // As a result, we need to apply the inverse of the 2x2 matrix (above) to the vector (tx, ty).
        const tx = -(a * m.tx + c * m.ty)
        const ty = -(b * m.tx + d * m.ty)

        return { a, b, c, d, tx, ty }
    }

    static applyMatrixToPoint(m, p) {
        return new Vector2(m.a * p.x + m.c * p.y + m.tx,
                           m.b * p.x + m.d * p.y + m.ty)
    }

    static applyRSToPoint(m, p) {
        return new Vector2(m.a * p.x + m.c * p.y,
                           m.b * p.x + m.d * p.y)
    }

    // Helper for ctx.SetTransform, since it expects either six numbers or a DOMMatrix
    static toDOMMatrix(m) { return new DOMMatrix([m.a, m.b, m.c, m.d, m.tx, m.ty]) }
}
