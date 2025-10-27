class SceneManager {
    static currentScene
    static nextScene

    static update() {
        if (SceneManager.nextScene) {
            SceneManager.currentScene = SceneManager.nextScene
            SceneManager.nextScene = undefined
        }
    }
    
    static loadScene(scene) {
        SceneManager.nextScene = scene
    }

    static getActiveScene() {
        return SceneManager.currentScene
    }
}