class Collisions {
  static inCollision(a, b) {
    //Get the points in the polygons on each game object
    const originalPointsA = a.getComponent(Polygon).points
    const originalPointsB = b.getComponent(Polygon).points

    //Apply the scale and positional transformational attributes to the points
    const worldPointsA = originalPointsA.map(p => p.scale(a.transform.scale).plus(a.transform.position))
    const worldPointsB = originalPointsB.map(p => p.scale(b.transform.scale).plus(b.transform.position))

    //Where each line formed by the polygons is stored
    const lines = []

    //For all point pairs in both arrays, find the orthogonal line and add it to lines
    for (const polygonPoints of [worldPointsA, worldPointsB]) {
      for (let i = 0; i < polygonPoints.length; i++) {
        const a = polygonPoints[i]
        const b = polygonPoints[(i+1)%polygonPoints.length]
        lines.push(a.minus(b).orthogonal())
      }
    }

    //For each line...
    for (const line of lines) {
      //...Find the dot product of all points in both polygons...
      const oneDots = worldPointsA.map(p => p.dot(line))
      const twoDots = worldPointsB.map(p => p.dot(line))

      //...and if there is a gap, they are not in collision
      if (Math.max(...oneDots) < Math.min(...twoDots) || Math.max(...twoDots) < Math.min(...oneDots)) return false
    }

    //If we get here, then the polygons were always overlapping, so we know they are in collision
    return true
  }
}