class Engine {
    static start() {
        Engine.canvas = document.querySelector("#canv")
        Engine.ctx = Engine.canvas.getContext("2d")
        Input.attach(Engine.canvas)

        window.addEventListener("resize", Engine.resizeCanvas)
        Engine.resizeCanvas()
        Engine.currentScene.start()
        Engine.animation = new AnimationManager()
        Engine.gameLoop()
    }


    static gameLoop() {
        Time.update()
        Engine.update()
        Engine.draw()
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