class BufferStream {
    #pendingBuffers: Buffer[] = []
    #ended = false
    constructor(public numParts: number) {
    }
    write(buffer: Buffer) {
        this.#pendingBuffers.push(buffer)    
    }
    end() {
        this.#ended = true
    }
    async read(): Promise<Buffer | undefined> {
        if (this.#pendingBuffers.length > 0) {
            return this.#pendingBuffers.shift()
        }
        else if (this.#ended) {
            return undefined
        }
        else {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (this.#pendingBuffers.length > 0) {
                        clearInterval(interval)
                        resolve(this.#pendingBuffers.shift())
                    }
                    else if (this.#ended) {
                        clearInterval(interval)
                        resolve(undefined)
                    }
                }, 10)
            })
        }
    }
}

export default BufferStream