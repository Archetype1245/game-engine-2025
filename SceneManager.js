class SceneManager {
    static currentScene
    static nextScene

    static update() {
        if (!this.nextScene) return

        if (this.currentScene) {
            Events.clearEventListeners()
            Engine.animation?.clear()
            Time.clearTimers()
            this.currentScene?.destroyAllGameObjects()
        }

        this.currentScene = this.nextScene
        this.nextScene = undefined
    }
    
    static loadScene(scene) {
        this.nextScene = scene
    }

    static getActiveScene() {
        return this.currentScene
    }
}