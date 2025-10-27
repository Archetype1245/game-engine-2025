class Scene {
    constructor(bg = "white") {
        this.started = false
        this.layerOrder = ["background", "foreground"]
        this.backgroundColor = bg
        this.gameObjects = []
        this.layerMap = new Map()

        this.colliderActors = new Set()             // GOs that should initiate collision checks
        this.colliderTargets = new Set()            // Potential targets of the collision checks
        this._hits = []

        this.activeCamera = null

        if (typeof Camera2D !== "undefined") {
            GameObject.instantiate(new CameraGameObject())
        }
    }

    start() {
        this.started = true
        this.lightDir = new Vector2(Config.lighting.lightDirection.x, Config.lighting.lightDirection.y).normalize()
        this.gameObjects.forEach(go => go.start())
    }

    update() {
        this.gameObjects.filter(go => !go.hasStarted).forEach(go => { go.start(); go.hasStarted = true })
        this.gameObjects.forEach(go => go.update())
        for (const t of this.colliderTargets) { this.cellData.update(t) }

        for (const a of this.colliderActors) {
            if (a.markForDelete) continue

            const hits = this.cellData.searchNeighbors(a, Config.objectType.enemy, this._hits)
            const rA = a.collider?.radius
            const pA = a.transform._position
            const swept = a.getComponent(SweptCircle)
            const useCCD = !!swept

            for (const b of hits) {
                if (b.markForDelete) continue

                const bPoly = b.collider ?? b.getComponent(PolygonCollider)
                const rB = bPoly.radius
                const pB = b.transform._position

                // If the GO has a SweptCircle component, check for hits via CCD. Otherwise use the other methods.
                if (useCCD) {
                    const p0 = swept.prevPos
                    const p1 = pA
                    const r = swept.r
                    if (!Collisions.capsuleHitsPoly(p0, p1, r, bPoly)) continue

                    for (const componentList of a.components.values()) {
                        componentList.forEach(c => c.onCollisionEnter?.(b))
                    }
                    for (const componentList of b.components.values()) {
                        componentList.forEach(c => c.onCollisionEnter?.(a))
                    }
                    continue
                }

                // If either Collider is missing a radius, skip the quick radius check and just check collision using SAT below
                if (rA && rB) {
                    const dx = pA.x - pB.x
                    const dy = pA.y - pB.y
                    const r2 = rA + rB
                    // If the hypotenuse of the x and y components is longer than the sum of the two radii, the GOs can't be in collision
                    // Comparing the squares rather than calculating out the sqrt via Math.hypot(dx, dy)
                    if ((dx * dx + dy * dy) > (r2 * r2)) continue
                }

                let response = Collisions.inCollision(a, b)
                if (!response) continue

                if (a.getComponent(RigidBody)) {
                    const dot = (pB.x - pA.x) * response.x + (pB.y - pA.y) * response.y
                    if (dot < 0) response = response.times(-1)
                    a.transform.translate(response.x, response.y)
                }
                if (b.getComponent(RigidBody)) {
                    const dot = (pA.x - pB.x) * response.x + (pA.y - pB.y) * response.y
                    if (dot < 0) response = response.times(-1)
                    b.transform.translate(response.x, response.y)
                }

                for (const componentList of a.components.values()) {
                    componentList.forEach(c => c.onCollisionEnter?.(b))
                }
                for (const componentList of b.components.values()) {
                    componentList.forEach(c => c.onCollisionEnter?.(a))
                }
            }
        }

        this.gameObjects = this.gameObjects.filter(go => {
            if (go.markForDelete) {
                this.removeFromLayerMap(go)
                this.unregisterForCollision(go)
                for (const componentList of go.components.values()) {
                    componentList.forEach(c => c.onDestroy?.())
                }
                return false
            }
            return true
        })
    }

    draw(ctx) {
        ctx.save()
        const S = this.activeCamera.getScreenMatrix()

        for (const layer of this.layerOrder) {
            const gameObjects = this.layerMap.get(layer)
            if (!gameObjects) continue

            for (const go of gameObjects) {
                const W = go.transform.worldMatrix
                const D = go.getComponent(Deform)?.getMatrix()
                const M = D ? Mat2D.matrix2dMultiply(W, D) : W
                const SM = Mat2D.matrix2dMultiply(S, M)

                ctx.setTransform(Mat2D.toDOMMatrix(SM))
                go.draw(ctx)
            }
        }

        ctx.restore()
    }

    initLayers() { this.layerOrder.forEach(layer => this.layerMap.set(layer, new Set())) }

    ensureLayerOrThrow(layer) {
        if (this.layerMap.has(layer)) return true
        throw new ReferenceError(`Layer "${layer}" not found`)
    }

    addToLayerMap(go) {
        this.ensureLayerOrThrow(go.layer)
        this.layerMap.get(go.layer)?.add(go)
    }

    removeFromLayerMap(go) {
        this.ensureLayerOrThrow(go.layer)
        this.layerMap.get(go.layer)?.delete(go)
    }

    changeLayer(go, layer) {
        if (go.layer === layer) return
        this.removeFromLayerMap(go)
        go.layer = layer
        this.addToLayerMap(go)
    }

    getLayerNameByIndex(idx) {
        if (idx < 0 || idx >= this.layerOrder.length) throw new RangeError(`Layer index out of range: ${idx}`)
        return this.layerOrder[idx]
    }

    moveGameObjectBy(go, shift) {
        const fromLayer = this.layerOrder.indexOf(go.layer)
        if (fromLayer < 0) throw new ReferenceError(`Layer "${go.layer}" not found.`)

        const toLayer = Math.max(0, Math.min(this.layerOrder.length - 1, fromLayer + shift))
        if (fromLayer !== toLayer) this.changeLayer(go, this.getLayerNameByIndex(toLayer))
    }

    moveGameObjectUp(go) { this.moveGameObjectBy(go, 1) }
    moveGameObjectDown(go) { this.moveGameObjectBy(go, -1) }

    registerForCollision(go) {
        if (!(go.getComponent(PolygonCollider) || go.getComponent(SweptCircle))) return

        if ((go.type & Config.objectType.enemy) === 0) { this.colliderActors.add(go) }
        else { this.colliderTargets.add(go) }
    }

    unregisterForCollision(go) {
        this.colliderActors.delete(go)
        this.colliderTargets.delete(go)
    }
}