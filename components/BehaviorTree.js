class BehaviorTree extends Component {
    static FAILED = 0
    static SUCCEEDED = 1
    static RUNNING = 2

    constructor() {
        super()
        this.node = null
    }

    update() {
        if (this.node) {
            return this.node.update(this)
        }
        return BehaviorTree.SUCCEEDED
    }

    reset() {
        if (this.node) {
            this.node.reset?.()
        }
    }
}

class BTNode {
    constructor() {
        this.children = []
    }

    addChild(child) {
        this.children.push(child)
        return this
    }

    update(tree) {
        return BehaviorTree.SUCCEEDED
    }

    reset() {
    }
}

class BTRepeater extends BTNode {
    constructor(times = -1) {
        super()
        this.times = times     // If times <= 0, repeats indefinitely
        this.currentCount = 0
    }

    update(tree) {
        if (this.children.length === 0) {
            return BehaviorTree.SUCCEEDED
        }

        const child = this.children[0]
        const result = child.update(tree)

        if (result === BehaviorTree.RUNNING) {
            return BehaviorTree.RUNNING
        }

        // Child finished (succeeded or failed)
        // Failed
        if (result === BehaviorTree.FAILED) {
            this.reset()
            return BehaviorTree.FAILED
        }

        // Succeeded
        if (this.times > 0) {
            this.currentCount++
            // Finished all repetitions
            if (this.currentCount >= this.times) {
                this.reset()
                return BehaviorTree.SUCCEEDED
            }
        }

        // Reset child for next iteration
        child.reset?.()
        return BehaviorTree.RUNNING
    }

    reset() {
        this.currentCount = 0

        if (this.children.length > 0) {
            this.children[0].reset?.()
        }
    }
}

class BTSequence extends BTNode {
    constructor() {
        super()
        this.currentIndex = 0
    }

    update(tree) {
        while (this.currentIndex < this.children.length) {
            const child = this.children[this.currentIndex]
            const result = child.update(tree)

            if (result !== BehaviorTree.SUCCEEDED) return result

            this.currentIndex++
        }
        // All children succeeded
        return BehaviorTree.SUCCEEDED
    }

    reset() {
        this.currentIndex = 0

        for (const child of this.children) {
            child.reset?.()
        }
    }
}

class BTSelector extends BTNode {
    constructor() {
        super()
        this.currentIndex = 0
    }

    update(tree) {
        while (this.currentIndex < this.children.length) {
            const child = this.children[this.currentIndex]
            const result = child.update(tree)

            if (result !== BehaviorTree.FAILED) return result

            this.currentIndex++
        }

        // All children failed
        return BehaviorTree.FAILED
    }

    reset() {
        this.currentIndex = 0

        for (const child of this.children) {
            child.reset?.()
        }
    }
}

class BTParallel extends BTNode {
    constructor() {
        super()
    }

    update(tree) {
        if (this.children.length === 0) { return BehaviorTree.SUCCEEDED }

        let allSucceeded = true
        let anyRunning = false

        for (const child of this.children) {
            const result = child.update(tree)
            
            if (result === BehaviorTree.FAILED) { return BehaviorTree.FAILED }
            if (result === BehaviorTree.RUNNING) {
                anyRunning = true
                allSucceeded = false
            }
        }

        if (anyRunning) { return BehaviorTree.RUNNING }
        // All children are done running, and none have failed (else this early-returned)
        return BehaviorTree.SUCCEEDED
    }

    reset() {
        for (const child of this.children) {
            child.reset?.()
        }
    }
}

class BTDuration extends BTNode {
    constructor(duration = 1.0) {
        super()
        this.duration = duration
        this.elapsedTime = 0
    }

    update(tree) {
        this.elapsedTime += Time.deltaTime

        if (this.elapsedTime >= this.duration) {
            return BehaviorTree.SUCCEEDED
        }

        return BehaviorTree.RUNNING
    }

    reset() {
        this.elapsedTime = 0
    }
}
