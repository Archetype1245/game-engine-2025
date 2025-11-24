class SpatialMap {
    constructor(cellSize = 64, trackedTags = []) {
        this.cs = cellSize
        this.cellData = new Map()
        this.trackedTags = new Set(trackedTags)
    }

    isTagTracked(tag) { return this.trackedTags.has(tag) }
    keyFromPos(x, y) { return `${Math.floor(x / this.cs)},${Math.floor(y / this.cs)}` }
    keyFromCell(i, j) { return `${i},${j}` }

    insert(object) {
        const tag = object.tag
        if (!this.isTagTracked(tag)) return

        if (!object.cellKey) {
            const t = object.transform.position
            object.cellKey = this.keyFromPos(t.x, t.y)
        }

        let cell = this.cellData.get(object.cellKey)
        if (!cell) this.cellData.set(object.cellKey, cell = new Set())
        cell.add(object)
    }

    remove(object) {
        const cell = this.cellData.get(object.cellKey)
        if (cell) {
            cell.delete(object)
            if (!cell.size) this.cellData.delete(object.cellKey)
        }
    }

    update(object) {
        const tag = object.tag
        if (!this.isTagTracked(tag)) return
        
        const p = object.transform._position
        const newKey = this.keyFromPos(p.x, p.y)
        if (newKey === object.cellKey) return

        this.remove(object)
        object.cellKey = newKey
        this.insert(object)
    }

    searchNeighbors(actor, targetTag, hits = [], radius = this.cs, subType = undefined) {
        const t = actor.transform.position
        // Floor divide to get correct cell after factoring in radius of search
        const i0 = Math.floor((t.x - radius) / this.cs)
        const i1 = Math.floor((t.x + radius) / this.cs)
        const j0 = Math.floor((t.y - radius) / this.cs)
        const j1 = Math.floor((t.y + radius) / this.cs)

        hits.length = 0
        for (let i = i0; i <= i1; i++) {
            for (let j = j0; j <= j1; j++) {
                const cell = this.cellData.get(this.keyFromCell(i, j))
                if (!cell) continue

                for (const target of cell) {
                    if (target === actor) continue  // Skip over self

                    const tag = target.tag
                    if (tag !== targetTag) continue
                    if (subType && subType !== target.subType) continue  // Skip over objects that don't match the subtype (if one is passed)
                    hits.push(target)
                }
            }
        }
        return hits
    }
}