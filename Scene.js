class Scene {
    constructor(config = {}) {
        this.started = false
        this.layerOrder = ["background", "ui"]
        this.gameObjects = []
        this.layerMap = new Map()
        this.initLayers()

        this.collidersByTag = new Map()
        this.collisionPairs = config.collisionPairs ?? []
        this._hits = []

        const trackedTags = config.trackedTags ?? []
        this.spatialMap = new SpatialMap(64, trackedTags)

        this.activeCamera = null
    }

    start() {
        this.started = true
        this.gameObjects.forEach(go => go.start())
    }

    update(dt) {
        this.gameObjects.filter(go => !go.hasStarted).forEach(go => { go.start(); go.hasStarted = true })
        this.gameObjects.forEach(go => go.update(dt))

        for (const [tag, gameObjects] of this.collidersByTag) {
            if (this.spatialMap.isTagTracked(tag)) {
                gameObjects.forEach(go => this.spatialMap.update(go))
            }
        }

        for (const pair of this.collisionPairs) {
            const [tagA, tagB] = pair
            const actorSet = this.collidersByTag.get(tagA)
            const targetSet = this.collidersByTag.get(tagB)

            if (!actorSet || !targetSet) continue

            for (const a of actorSet) {
                if (a.markForDelete) continue

                let targets
                if (this.spatialMap.isTagTracked(tagB)) {
                    targets = this.spatialMap.searchNeighbors(a, tagB, this._hits)
                } else {
                    targets = targetSet
                }

                const rA = a.collider?.radius
                const pA = a.transform._position
                const swept = a.getComponent(SweptCircle)
                const useCCD = !!swept

                for (const b of targets) {
                    if (a === b || b.markForDelete) continue

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
                        // If the hypotenuse of the x and y components is longer than the sum of the two radii, the GOs can't be in coll
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
        }

        this.gameObjects = this.gameObjects.filter(go => {
            if (go.markForDelete) {
                this.removeFromLayerMap(go)
                this.unregisterForCollision(go)
                this.spatialMap.remove(go)
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
            if (layer === "ui") continue
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
        ctx.save()
        const uiGameObjects = this.layerMap.get("ui")
        if (uiGameObjects) {
            for (const go of uiGameObjects) {
                const W = go.transform.worldMatrix
                ctx.setTransform(Mat2D.toDOMMatrix(W))
                go.draw(ctx)
            }
        }
        ctx.restore()
    }

    initLayers() {
        for (const layer of this.layerOrder) {
            if (!this.layerMap.get(layer)) this.layerMap.set(layer, new Set())
        }
    }

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

        const tag = go.tag
        if (!this.collidersByTag.has(tag)) {
            this.collidersByTag.set(tag, new Set())
        }
        this.collidersByTag.get(tag).add(go)

        if (this.spatialMap.isTagTracked(tag)) {
            this.spatialMap.insert(go)
        }
    }

    unregisterForCollision(go) {
        const tag = go.tag
        const tagSet = this.collidersByTag.get(tag)

        if (tagSet) {
            tagSet.delete(go)

            if (tagSet.size === 0) {
                this.collidersByTag.delete(tag)
            }
        }
    }
}