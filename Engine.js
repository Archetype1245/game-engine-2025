class Engine {
    static start() {
        Engine.canvas = document.querySelector("#canv")
        Engine.ctx = Engine.canvas.getContext("2d")
        Input.attach(Engine.canvas)
        
        window.addEventListener("resize", Engine.resizeCanvas)
        Engine.resizeCanvas()
        Engine.animation = new AnimationManager()

        SceneManager.update()
        SceneManager.currentScene.start()
        Engine.renderer = Engine.defaultRenderer
        requestAnimationFrame(Engine.gameLoop)
    }

    static gameLoop(now) {
        Time.update(now)
        SceneManager.update()
        Engine.update()
        Engine.draw()
        requestAnimationFrame(Engine.gameLoop)
    }

    static update() {
        SceneManager.currentScene.update(Time.unscaledDeltaTime)
        Engine.animation.update()
        Input.endFrame()
    }

    static draw() {
        const ctx = Engine.ctx
        const scene = SceneManager.currentScene

        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, Engine.canvas.width, Engine.canvas.height)

        // scene.draw(ctx)
        Engine.renderer(ctx, scene)
    }

    static defaultRenderer(ctx, scene) {
        scene.draw(ctx)
    }

    static resizeCanvas() {
        Engine.canvas.width = window.innerWidth
        Engine.canvas.height = window.innerHeight
    }
}