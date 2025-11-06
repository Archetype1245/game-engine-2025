class GameObject {
    name = "GameObject"
    layer = "background"
    tag = "default"
    components = new Map()
    hasStarted = false
    markForDelete = false

    constructor(name) {
        this.name = name
        this.addComponent(new Transform())
    }

    start() {
        for (const componentList of this.components.values()) {
            componentList.forEach(c => c.start())
        }

        SceneManager.currentScene.registerForCollision(this)
        this.hasStarted = true
    }

    update() {
        for (const componentList of this.components.values()) {
            componentList.forEach(c => c.update())
        }

        // if (this.hasStarted) {
        //     component.start()

        // }
    }

    draw(ctx) {
        for (const componentList of this.components.values()) {
            componentList.forEach(c => c.draw(ctx))
        }
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

    get transform() {
        return this.getComponent(Transform)
    }

    destroy() {
        this.markForDelete = true
    }

    static getObjectByName(name) {
        return SceneManager.currentScene.gameObjects.find(gameObject => gameObject.name == name)
    }

    static instantiate(go, { position = null, scene = null, layer, forceStart = false }) {
        const currentScene = scene ?? SceneManager.currentScene
        currentScene.gameObjects.push(go)

        if (layer) go.layer = layer
        currentScene.addToLayerMap(go)

        if (position) go.transform.position = position
        if (forceStart) { go.start(); go.hasStarted = true }
        return go
    }
}