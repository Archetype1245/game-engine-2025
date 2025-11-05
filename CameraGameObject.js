class CameraGameObject extends GameObject{
    constructor(opts = {}){
        super("CameraGameObject")
        this.addComponent(new Camera2D(opts))
    }
}