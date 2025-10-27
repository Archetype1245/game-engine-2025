class Engine {

    static start() {
        Engine.canvas = document.querySelector("#canv")
        Engine.ctx = Engine.canvas.getContext("2d")
        Input.attach(Engine.canvas)

        Engine.bufferCanvas = document.createElement("canvas")
        Engine.bctx = Engine.bufferCanvas.getContext("2d", {alpha: true})
        


        window.addEventListener("resize", Engine.resizeCanvas)
        Engine.resizeCanvas()

        Engine.currentScene.start()
        Engine.animation = new AnimationManager()
        Engine.fps = new FPSTracker({ smooth: 0.9, history: 240, uiHz: 4 });
        requestAnimationFrame(Engine.gameLoop)
    }



    static gameLoop(now) {
        Time.update()
        Engine.update()
        Engine.draw()
        Engine.fps.frame(now)
        requestAnimationFrame(Engine.gameLoop)
    }

    static update() {
        Engine.currentScene.update()
        Engine.animation.update(Time.deltaTime)
        Input.endFrame()
    }

    static draw() {
        Engine.ctx.fillStyle = "#003d58ff"
        Engine.ctx.beginPath()
        Engine.ctx.rect(0, 0, Engine.canvas.width, Engine.canvas.height)
        Engine.ctx.fill()

        Engine.currentScene.draw(Engine.ctx)
    }

    static resizeCanvas() {
        Engine.canvas.width = window.innerWidth
        Engine.canvas.height = window.innerHeight
    }
}