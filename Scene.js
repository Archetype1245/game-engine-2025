class Scene {
    constructor(bg = "white") {
        this.started = false
        this.layerOrder = ["background", "foreground"]
        this.backgroundColor = bg
        this.gameObjects = []
        this.layerMap = new Map()

        this.activeCamera = null
    }

    start() {
        this.started = true
        this.lightDir = new Vector2(Config.lighting.lightDirection.x, Config.lighting.lightDirection.y).normalize()
        this.gameObjects.forEach(go => go.start())
    }

    update() {
        this.gameObjects.filter(go => !go.hasStarted).forEach(go => { go.start(); go.hasStarted = true })
        this.gameObjects.forEach(go => go.update())

        const gameObjectsWithColliders = this.gameObjects.filter(go => go.getComponent(Collider))
        for (let i = 0; i < gameObjectsWithColliders.length; i++) {
            for (let j = i + 1; j < gameObjectsWithColliders.length; j++) {
                let a = gameObjectsWithColliders[i]
                let b = gameObjectsWithColliders[j]
                let response = Collisions.inCollision(a, b)
                if (response) {
                    if (a.getComponent(RigidBody)) {
                        if (a.transform.position.minus(b.transform.position).dot(response) < 0)
                            response *= -1
                        a.transform.position.plusEquals(response)
                    }
                    if (b.getComponent(RigidBody)) {
                        if (b.transform.position.minus(a.transform.position).dot(response) < 0)
                            response *= -1
                        b.transform.position.plusEquals(response)
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
        if (this.activeCamera) {
            ctx.setTransform(Mat2D.toDOMMatrix(this.activeCamera.getScreenMatrix()))
        }

        for (const layer of this.layerOrder) {
            const gameObjects = this.layerMap.get(layer)
            if (gameObjects) gameObjects.forEach(go => go.draw(ctx))
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
}