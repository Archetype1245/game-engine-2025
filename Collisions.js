class Collisions {
	static inCollision(a, b) {
		//Get the points in the polygons on each game object
		const aColl = a.collider ?? a.getComponent(PolygonCollider)
		const bColl = b.collider ?? b.getComponent(PolygonCollider)
		const worldPointsA = aColl.worldPoints
		const worldPointsB = bColl.worldPoints
		
		//Where each line formed by the polygons is stored
		const lines = []
		//For all point pairs in both arrays, find the orthogonal line and add it to lines
		for (const polygonPoints of [worldPointsA, worldPointsB]) {
			for (let i = 0; i < polygonPoints.length; i++) {
				const pa = polygonPoints[i]
				const pb = polygonPoints[(i + 1) % polygonPoints.length]
				lines.push(pa.minus(pb).orthogonal().normalize())
			}
		}
		
		//For each line...
		const diffs = []
		for (const line of lines) {
			//...Find the dot product of all points in both polygons...
			const oneDots = worldPointsA.map(p => p.dot(line))
			const twoDots = worldPointsB.map(p => p.dot(line))

			//...and if there is a gap, they are not in collision
			const diffA = Math.max(...oneDots) - Math.min(...twoDots)
			const diffB = Math.max(...twoDots) - Math.min(...oneDots)
			if (diffA < 0 || diffB < 0) return false

			const minDiff = Math.min(diffA, diffB)
			diffs.push(minDiff)
		}

		//If we get here, then the polygons were always overlapping, so we know they are in collision
		const minDiff = Math.min(...diffs)
		const minDiffIndex = diffs.indexOf(minDiff)
		const mtvLine = lines[minDiffIndex]
		return mtvLine.times(minDiff)
	}

	static aabbOverlap(a, b) {
		return !(a.max.x < b.min.x || b.max.x < a.min.x ||
			a.max.y < b.min.y || b.max.y < a.min.y)
	}

	// Checking segments AB and CD
	static DistanceSquaredCheck(A, B, C, D) {
		const u = new Vector2(B.x - A.x, B.y - A.y)
		const v = new Vector2(D.x - C.x, D.y - C.y)
		const w = new Vector2(A.x - C.x, A.y - C.y)

		const uu = u.dot(u)                               // u.u
		const uv = u.dot(v)                               // u.v
		const vv = v.dot(v)                               // v.v
		const uw = u.dot(w)                               // u.w
		const vw = v.dot(w)                               // v.w
		const denom = uu * vv - uv * uv

		let s, t
		if (denom < MathUtils.EPS) {
			s = 0
			t = MathUtils.clamp01(-vw / (vv || 1))
		} else {
			s = MathUtils.clamp01((uv * vw - vv * uw) / denom)
			t = MathUtils.clamp01((uu * vw - uv * uw) / denom)
		}

		const cx = A.x + s * u.x - (C.x + t * v.x)
		const cy = A.y + s * u.y - (C.y + t * v.y)
		return cx * cx + cy * cy
	}

	static pointInPoly(p, poly) {
		let isInside = false   // Flag will be true if the number of line-crosses to the right is odd, which indicates a point *inside* the polygon
		let j = poly.length - 1
		for (let i = 0; i < poly.length; i++) {
			const xi = poly[i].x
			const yi = poly[i].y
			const xj = poly[j].x
			const yj = poly[j].y

			// Checks if the start/end y-values of the edge are on opposite sides of the point
			const lineCrosses = (yi > p.y) !== (yj > p.y)
			if (lineCrosses) {
				/*
				 * Parameterize the edge -> E(t)        = vi + t*(vj - vi)
				 * For y, this is just   -> E(t).y = py = yi + t*(yj - yi)
				 * Solving for t when E(t.y) = py... -> t = (py - yi) / (yj - yi)
				 * 
				 * Similarly, for x, we have -> xi + t*(xj - xi)
				 * Plugging in the value for t, we have xi + (xj - xi) * (p.y - yi) / (yj - yi)
				*/
				const xHit = xi + (xj - xi) * (p.y - yi) / (yj - yi)
				// If the x-value is to the right of our point, flip the bool flag
				if (p.x < xHit) isInside = !isInside
			}
			j = i
		}
		return isInside
	}

	static capsuleHitsPoly(p0, p1, r, poly) {
		const capsuleAABB = {
			min: { x: Math.min(p0.x, p1.x) - r, y: Math.min(p0.y, p1.y) - r },
			max: { x: Math.max(p0.x, p1.x) + r, y: Math.max(p0.y, p1.y) + r }
		}
		const polyWorld = poly.worldPoints
		if (!Collisions.aabbOverlap(capsuleAABB, poly.aabb)) return false
		if (Collisions.pointInPoly(p0, polyWorld)) return true
		if (Collisions.pointInPoly(p1, polyWorld)) return true

		const r2 = r * r
		for (let i = 0; i < polyWorld.length; i++) {
			const e0 = polyWorld[i]
			const e1 = polyWorld[(i + 1) % polyWorld.length]
			const d2 = Collisions.DistanceSquaredCheck(p0, p1, e0, e1)
			if (d2 <= r2) return true
		}
		return false
	}
}