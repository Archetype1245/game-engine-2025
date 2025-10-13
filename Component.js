class Component{
    name = this.constructor.name
    gameObject = null
    started = false
    
    start() {

    }
    update() {

    }
    draw() {
        
    }
    
    get transform() {
        return this.gameObject.transform
    }
}