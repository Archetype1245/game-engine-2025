class Engine {
    static start() {
        Engine.canvas = document.querySelector("#canv")
        Engine.ctx = Engine.canvas.getContext("2d")
        Input.attach(Engine.canvas)

        Engine.offscreenCanvas = document.createElement("canvas")
        Engine.ctxOS = Engine.offscreenCanvas.getContext("2d", {alpha: true})
        
        window.addEventListener("resize", Engine.resizeCanvas)
        Engine.resizeCanvas()

        SceneManager.update()
        SceneManager.currentScene.start()
        Engine.animation = new AnimationManager()
        // Engine.fps = new FPSTracker({ smooth: 0.9, history: 240, uiHz: 4 });
        requestAnimationFrame(Engine.gameLoop)
    }


    static gameLoop(now) {
        Time.update()
        SceneManager.update()
        Engine.update()
        Engine.draw()
        // Engine.fps.frame(now)
        requestAnimationFrame(Engine.gameLoop)
    }

    static update() {
        SceneManager.currentScene.update(Time.deltaTime)
        Engine.animation.update(Time.deltaTime)
        Input.endFrame()
    }

    static draw() {
        Engine.ctx.fillStyle = SceneManager.currentScene.activeCamera.backgroundColor
        Engine.ctx.beginPath()
        Engine.ctx.rect(0, 0, Engine.canvas.width, Engine.canvas.height)
        Engine.ctx.fill()

        SceneManager.currentScene.draw(Engine.ctx)
    }

    static resizeCanvas() {
        Engine.canvas.width = window.innerWidth
        Engine.canvas.height = window.innerHeight
    }
}