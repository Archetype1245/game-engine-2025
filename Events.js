class Events {
    static handlers = new Map()

    static addEventListener(signal, listener) {
        let listeners = this.handlers.get(signal)
        if (!listeners) this.handlers.set(signal, listeners = new Set())
        listeners.add(listener)
    }

    static removeEventListener(signal, listener) {
        const listeners = this.handlers.get(signal)
        if (!listeners) return

        listeners.delete(listener)
        if (!listeners.size) this.handlers.delete(signal)
    }

    static clearEventListeners(signal) {
        if (signal === undefined) this.handlers.clear();
        else this.handlers.delete(signal)
    }

    static fireEvent(signal, event) {
        const listeners = this.handlers.get(signal)
        if (!listeners) return

        for (const listener of [...listeners]) {
            if (typeof listener === "function") {
                listener(event)
            } else {
                listener.handleEvent?.(signal, event)
            }
        }
    }
}
