class Input {
    static canvas = null
    static mouseX = 0
    static mouseY = 0
    static lastMouseX = 0
    static lastMouseY = 0
    static mouseIsDown = false
    static keysDown = new Set()
    static prevKeys = new Set()
    static mouseClicks = { left: false, right: false }
    static queuedClicks = { left: false, right: false }

    static attach(canvas) {
        Input.canvas = canvas

        document.addEventListener("keydown", (Input.keyDown))
        document.addEventListener("keyup", Input.keyUp)

        canvas.addEventListener("mousemove", Input.mouseMove)
        canvas.addEventListener("mousedown", Input.mouseDown)
        canvas.addEventListener("mouseup", Input.mouseUp)
        canvas.addEventListener("contextmenu", e => e.preventDefault())
    }

    static beginFrame() {
        Input.mouseClicks.left = Input.queuedClicks.left
        Input.mouseClicks.right = Input.queuedClicks.right
        Input.queuedClicks = { left: false, right: false }
    }

    static endFrame() {
        Input.prevKeys = new Set(Input.keysDown)
        Input.lastMouseX = Input.mouseX
        Input.lastMouseY = Input.mouseY   
    }

    static keyDown(e) {
        Input.keysDown.add(e.code)
    }
    static keyUp(e) {
        Input.keysDown.delete(e.code)
    }

    static keyPressed(code) {
        return Input.keysDown.has(code) && !Input.prevKeys.has(code)
    }

    static keyReleased(code) {
        return Input.prevKeys.has(code) && !Input.keysDown.has(code)
    }

    static keyHeld(code) {
        return Input.keysDown.has(code)
    }

    static mouseMove(e) {
        Input.lastMouseX = Input.mouseX
        Input.lastMouseY = Input.mouseY

        Input.mouseX = e.clientX
        Input.mouseY = e.clientY
    }

    static mouseDown(e) {
        Input.mouseMove(e)
        if (e.button === 0) {
            Input.mouseIsDown = true
        }
    }

    static mouseUp(e) {
        Input.mouseMove(e)
        if (e.button === 0) {
            Input.mouseIsDown = false
            Input.queuedClicks.left = true
        }
        if (e.button === 2) {
            Input.queuedClicks.right = true
        }
    }

    static consumeClick(btn) {
        const check = Input.clickType[btn]
        Input.clickType[btn] = false
        return check
    }
}