class GameObject {
    name = "[NO NAME]"
    layer = "background"
    tag = "default"
    components = new Map()
    hasStarted = false
    markForDelete = false

    constructor(name, options) {
        this.name = name
        Object.assign(this, options)
        this.addComponent(new Transform())
    }

    get transform() {
        return this.getComponent(Transform)
    }

    broadcastMessage(name, ...args) {
        for (const componentList of this.components.values()) {
            for (const component of componentList) {
                if (typeof component[name] === "function") {
                    component[name](...args)
                }
            }
        }
    }

    start() {
        this.broadcastMessage("start")
        this.hasStarted = true
        // These only register GOs that fit the criteria (have some form of collider or a tracked tag, respectively)
        SceneManager.currentScene.registerForCollision(this)
        SceneManager.currentScene.registerInSpatialMap(this)
    }

    update(dt) {
        if (!this.hasStarted) this.start()
        this.broadcastMessage("update", dt)
    }

    lateUpdate(dt) {
        this.broadcastMessage("lateUpdate", dt)
    }

    draw(ctx) {
        this.broadcastMessage("draw", ctx)
    }

    addComponent(component, values) {
        const type = component.constructor
        if (!this.components.has(type)) this.components.set(type, [])

        this.components.get(type).push(component)
        component.gameObject = this
        Object.assign(component, values)

        return component
    }

    getComponent(type) {
        const components = this.components.get(type)
        return components ? components[0] : null
    }

    getComponents(type) {
        this.components.get(type)
        return this.components.get(type) ?? []
    }

    destroy() {
        this.markForDelete = true
        const children = this.transform.children
        for (const child of children) {
            child.gameObject.destroy()
        }
    }

    static getObjectByName(name) {
        return SceneManager.currentScene.gameObjects.find(go => go.name === name)
    }

    static getObjectsByTag(tag) {
        return SceneManager.currentScene.gameObjects.filter(go => go.tag === tag)
    }

    static instantiate(go, { position = null, scene = null, layer, forceStart = false }) {
        const currentScene = scene ?? SceneManager.currentScene
        currentScene.gameObjects.push(go)

        if (layer) go.layer = layer
        currentScene.addToLayerMap(go)

        if (position) go.transform.position = position
        if (forceStart) {
            go.start()
        }
        return go
    }
}