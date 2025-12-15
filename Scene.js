class Scene {
    constructor(config = {}) {
        this.started = false
        this.defaultLayerDefs = ["background", "ui"]
        this.gameObjects = []

        const layerDefs = config.layerDefs ?? this.defaultLayerDefs
        this._initLayers(layerDefs)

        this.collidersByTag = new Map()
        this.collisionPairs = config.collisionPairs ?? []
        this._hits = []

        const trackedTags = config.trackedTags ?? []
        this.spatialMap = new SpatialMap(64, trackedTags)
        this.objectsInSpatialMap = new Set()

        this.activeCamera = null
    }

    start() {
        this.started = true
        this.gameObjects.forEach(go => go.start())
    }

    update(dt) {
        this.gameObjects.filter(go => !go.hasStarted).forEach(go => { go.start(); go.hasStarted = true })
        // this.gameObjects.forEach(go => go.update(dt))

        // Bit of a hacky way of implementing different time scales - would fix with more time to work on it
        // Each layer has a corresponding time scale - this just passes the correct `dt` value to each
        // Ideally this would be more specific and times wouldn't necessarily be tied to layers
        for (let i = this.layerOrder.length - 1; i >= 0; i--) {
            const layerName = this.layerOrder[i]
            const layer = this.layerMap.get(layerName)
            if (!layer) continue
            const dt = Time.dt[layer.time] ?? Time.dt.world
            if (dt === 0) continue

            for (const go of layer.objects) {
                if (!go.markForDelete) go.update(dt)
            }
        }

        // lateUpdate
        for (let i = this.layerOrder.length - 1; i >= 0; i--) {
            const layerName = this.layerOrder[i]
            const layer = this.layerMap.get(layerName)
            if (!layer) continue
            const dt = Time.dt[layer.time] ?? Time.dt.world
            if (dt === 0) continue

            for (const go of layer.objects) {
                if (!go.markForDelete) go.lateUpdate(dt)
            }
        }

        if (Time.dt.world > 0) {
            for (const go of this.objectsInSpatialMap) { this.spatialMap.update(go) }
            this._runCollisionChecks()
        }

        this._cleanupDestroyed()
    }

    draw(ctx) {
        this._beginCamera(ctx)
        this.drawLayers(ctx, () => true) // draw everything by default
        this._endCamera(ctx)
    }

    _beginCamera(ctx) {
        ctx.save()

        const vp = this.activeCamera.getViewportRect()

        ctx.fillStyle = this.activeCamera.backgroundColor
        ctx.fillRect(vp.x, vp.y, vp.width, vp.height)

        ctx.beginPath()
        ctx.rect(vp.x, vp.y, vp.width, vp.height)
        ctx.clip()
    }

    _endCamera(ctx) {
        ctx.restore()
    }

    drawLayers(ctx, shouldDrawLayer) {
        const S = this.activeCamera.getScreenMatrix()

        for (const name of this.layerOrder) {
            if (shouldDrawLayer && !shouldDrawLayer(name)) continue

            const layer = this.layerMap.get(name)
            if (!layer || layer.objects.size === 0) continue

            const layerMatrix = layer.space === "world" ? S : Mat2D.identity

            for (const go of layer.objects) {
                const W = go.transform.worldMatrix
                const D = go.getComponent(Deform)?.getMatrix()
                const objMatrix = D ? Mat2D.matrix2dMultiply(W, D) : W

                const T = Mat2D.matrix2dMultiply(layerMatrix, objMatrix)

                ctx.setTransform(Mat2D.toDOMMatrix(T))
                go.draw(ctx)
            }
        }
    }

    _initLayers(layerDefs) {
        this.layerOrder = layerDefs.map(d => d.name)       // Generate layer order using just the names from layerDefs
        this.layerMap = new Map(layerDefs.map(d => [d.name, {
            space: d.space,
            objects: new Set(),
            time: d.time ?? "world"
        }]))
    }

    _runCollisionChecks() {
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
    }

    _cleanupDestroyed() {
        this.gameObjects = this.gameObjects.filter(go => {
            if (go.markForDelete) {
                this.removeFromLayerMap(go)
                this.unregisterForCollision(go)
                this.unregisterInSpatialMap(go)
                for (const componentList of go.components.values()) {
                    componentList.forEach(c => c.onDestroy?.())
                }
                return false
            }
            return true
        })
    }

    _ensureLayerOrThrow(layer) {
        if (this.layerMap.has(layer)) return true
        throw new ReferenceError(`Layer "${layer}" not found`)
    }

    addToLayerMap(go) {
        this._ensureLayerOrThrow(go.layer)
        this.layerMap.get(go.layer)?.objects.add(go)
    }

    removeFromLayerMap(go) {
        this._ensureLayerOrThrow(go.layer)
        this.layerMap.get(go.layer)?.objects.delete(go)
    }

    changeLayer(go, layer) {
        if (go.layer === layer) return
        this.removeFromLayerMap(go)
        go.layer = layer
        this.addToLayerMap(go)
    }

    getLayerNameByIndex(idx) {
        if (idx < 0 || idx >= this.layerOrder.length) {
            throw new RangeError(`Layer index out of range: ${idx}`)
        }
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

    registerInSpatialMap(go) {
        if (!this.spatialMap.isTagTracked(go.tag)) return

        this.spatialMap.insert(go)
        this.objectsInSpatialMap.add(go)
    }

    unregisterInSpatialMap(go) {
        this.spatialMap.remove(go)
        this.objectsInSpatialMap.delete(go)
    }

    destroyAllGameObjects() {
        this.gameObjects.forEach(go => go.destroy())

        this._flushDestroyed()
    }

    _flushDestroyed() {
        this.gameObjects = this.gameObjects.filter(go => {
            if (!go.markForDelete) return true

            this.removeFromLayerMap(go)
            this.unregisterForCollision(go)
            this.unregisterInSpatialMap(go)
            for (const componentList of go.components.values()) {
                componentList.forEach(c => c.onDestroy?.())
            }
            return false
        })

        this.collidersByTag.clear()
        this.objectsInSpatialMap.clear()
        this.spatialMap.clear()
    }
}