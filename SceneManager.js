class SceneManager {
    static scenes = []
    static currentSceneIndex = 0

    static addScene(scene) {
        SceneManager.scenes.push(scene)
        return scene
    }

    static getActiveScene() {
        return SceneManager.scenes[SceneManager.currentSceneIndex];
    }
}