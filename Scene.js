class Scene {
    started = false
    gameObjects = []
    layerMap = new Map()
    layerOrder = ["background", "foreground"]

    start() {
        this.started = true

        for (const gameObject of this.gameObjects) {
            gameObject.start()
        }
    }

    update() {
        for (const gameObject of this.gameObjects) {
            if (!gameObject.hasStarted) {
                gameObject.start()
                gameObject.hasStarted = true
            }
            gameObject.update()
        }

        this.gameObjects = this.gameObjects.filter(go => {
            if (go.markForDelete) {
                this.removeFromLayerMap(go)
                return false
            }
            return true
        })
    }

    draw(ctx) {
        for (const layer of this.layerOrder) {
            const gameObjects = this.layerMap.get(layer)
            if (gameObjects) gameObjects.forEach(go => go.draw(ctx))
        }
    }

    initLayers() {
        for (const layer of this.layerOrder) {
            this.layerMap.set(layer, new Set())
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
        if(fromLayer < 0) throw new ReferenceError(`Layer "${go.layer}" not found.`)

        const toLayer = Math.max(0, Math.min(this.layerOrder.length - 1, fromLayer + shift))
        if (fromLayer !== toLayer) this.changeLayer(go, this.getLayerNameByIndex(toLayer))
    }

    moveGameObjectUp(go) {
        this.moveGameObjectBy(go, 1)
    }

    moveGameObjectDown(go) {
        this.moveGameObjectBy(go, -1)
    }

    static instantiate(gameObject, { position = null, scene = null, layer, forceStart = false }) {
        const currentScene = scene ?? SceneManager.getActiveScene()
        currentScene.gameObjects.push(gameObject)

        gameObject.layer = layer ?? "background"
        currentScene.addToLayerMap(gameObject)

        if (position) gameObject.transform.position = position
        // Basically a way to force a GO's Start() to act like Awake() would
        if (forceStart) { gameObject.start(); gameObject.hasStarted = true }
        return gameObject
    }
}