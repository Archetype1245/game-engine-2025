class RigidBody extends Component{
    velocity = Vector2.zero
    acceleration = Vector2.zero
    gravity = Vector2.zero
    update(){
        this.velocity.plusEquals(this.acceleration.times(Time.deltaTime))
        this.velocity.plusEquals(this.gravity.times(Time.deltaTime))
        this.transform.position.plusEquals(this.velocity.times(Time.deltaTime))
    }
}