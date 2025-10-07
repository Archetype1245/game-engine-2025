class GameObject {
    name = ""
    // components = []
    components = new Map()
    hasStarted = false
    markForDelete = false

    constructor(name) {
        this.name = name
        this.addComponent(new Transform())
    }

    start() {
        for (const componentList of this.components.values()) {
            componentList.forEach(c => c.start?.())
        }
        this.hasStarted = true
    }

    update() {
        for (const componentList of this.components.values()) {
            componentList.forEach(c => c.update?.())
        }
    }

    draw(ctx) {
        for (const componentList of this.components.values()) {
            componentList.forEach(c => c.draw?.(ctx))
        }
    }

    addComponent(component, values) {
        const type = component.constructor
        if (!this.components.has(type)) this.components.set(type, [])

        this.components.get(type).push(component)
        component.gameObject = this
        Object.assign(component, values)

        // if (this.hasStarted) {
        //     component.start?.()

        // }

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
        return SceneManager.getActiveScene().gameObjects.find(gameObject => gameObject.name == name)
    }
}