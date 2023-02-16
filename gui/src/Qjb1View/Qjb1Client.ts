import RtcshareFileSystemClient from "../RtcshareDataManager/RtcshareFileSystemClient";

const expectedInitialText = 'qjb1.ecv9vh5lt\n'
const chunkSize = 1000 * 1000 * 4 // 4MB chunks. Is this a good choice?

type Qjb1Header = {
    video_width: number,
    video_heigth: number,
    frames_per_second: number,
    quality: number,
    format: string,
    num_frames: number
}

class Qjb1Client {
    #initializing = false
    #initialized = false
    #chunks: {[chunkIndex: number]: ArrayBuffer} = {}
    #headerRecordText: string | undefined
    #framePositions: Uint32Array | undefined
    #headerRecord: Qjb1Header | undefined
    #fetchingChunks = new Set<number>()
    constructor(private fileSystemClient: RtcshareFileSystemClient, private path: string) {

    }
    header() {
        return this.#headerRecord
    }
    async getFrameImage(frameIndex: number) {
        await this.initialize()
        if (!this.#framePositions) return undefined // unexpected
        if (frameIndex < 0) return undefined
        if (frameIndex + 1 >= this.#framePositions.length) return undefined
        const d = await this._fetchData(this.#framePositions[frameIndex], this.#framePositions[frameIndex + 1])
        if (!d) return undefined
        return d
    }
    async initialize() {
        if (this.#initialized) return
        if (this.#initializing) {
            while (this.#initializing) {
                await sleepMsec(100)
            }
            return
        }
        this.#initializing = true
        try {
            const chunk0 = await this._fetchChunk(0)
            if (!chunk0) throw Error('Unable to load initial chunk')
            const dec = new TextDecoder()
            const initialText = dec.decode(chunk0.slice(0, expectedInitialText.length))
            if (initialText !== expectedInitialText) {
                throw Error('Invalid qjb1 file - unexpected initial text.')
            }

            let i = 0
            while (!this._haveEnoughDataToReadHeaderRecord()) {
                if (!(await this._fetchChunk(i))) {
                    throw Error('Unable to fetch chunk while trying to read header record')
                }
                i = i + 1
            }
            this.#headerRecordText = ''
            i = 0
            // eslint-disable-next-line no-constant-condition
            while (true) {
                let buf = this.#chunks[i]
                if (i === 0) buf = buf.slice(expectedInitialText.length)
                const dec = new TextDecoder()
                const aa = dec.decode(buf)
                if (aa.includes('\n')) {
                    this.#headerRecordText += aa.slice(0, aa.indexOf('\n'))
                    break
                }
                else {
                    this.#headerRecordText += aa
                }
                i += 1
            }
            this.#headerRecord = JSON.parse(this.#headerRecordText)
            if (!this.#headerRecord) throw Error('unexpected')
            const numFrames = this.#headerRecord.num_frames
            const b1 = expectedInitialText.length + this.#headerRecordText.length + 1
            const frameSizesBuffer = await this._fetchData(b1, b1 + 4 * numFrames)
            if (!frameSizesBuffer) throw Error('Unable to read frame sizes')
            const frameSizes = new Uint32Array(frameSizesBuffer)
            if (frameSizes[0] > 10 * 1000 * 1000) {
                const debugDV = new DataView(frameSizesBuffer)
                console.warn(debugDV.getUint32(0, true), debugDV.getUint32(0, false))
                throw Error(`Unexpected frame size ${frameSizes[0]}. Perhaps there is an endianness problem?`)
            }
            this.#framePositions = new Uint32Array(numFrames)
            let pos = b1 + 4 * numFrames
            for (let iframe = 0; iframe < numFrames; iframe ++) {
                this.#framePositions[iframe] = pos
                pos += frameSizes[iframe]
            }
        }
        catch(err) {
            console.error('Error initializing annotations client', err)
        }
        finally {
            this.#initializing = false
            this.#initialized = true
        }
    }
    _haveEnoughDataToReadHeaderRecord() {
        let i = 0
        // eslint-disable-next-line no-constant-condition
        while (true) {
            let buf = this.#chunks[i]
            if (!buf) return false
            if (i === 0) buf = buf.slice(expectedInitialText.length)
            const dec = new TextDecoder()
            const txt = dec.decode(buf)
            if (txt.includes('\n')) {
                return true
            }
            i += 1
        }
    }
    async _fetchData(b1: number, b2: number): Promise<ArrayBuffer | undefined> {
        const i1 = Math.floor(b1 / chunkSize)
        const i2 = Math.floor(b2 / chunkSize)
        const pieces: ArrayBuffer[] = []
        for (let i = i1; i <= i2; i++) {
            let ch = await this._fetchChunk(i)
            if (!ch) return undefined
            if (i === i2) {
                ch = ch.slice(0, b2 - i * chunkSize)
            }
            if (i === i1) {
                ch = ch.slice(b1 - i * chunkSize)
            }
            pieces.push(ch)
        }
        // trigger getting the next chunk in advance (buffering)
        this._fetchChunk(i2 + 1)
        return concatenateArrayBuffers(pieces)
    }
    async _fetchChunk(i: number) {
        if (this.#chunks[i]) return this.#chunks[i]
        if (this.#fetchingChunks.has(i)) {
            while (this.#fetchingChunks.has(i)) {
                await sleepMsec(100)
            }
            return this.#chunks[i]
        }
        this.#fetchingChunks.add(i)
        try {
            const i1 = chunkSize * i
            const i2 = chunkSize * (i + 1)
            const content = await this.fileSystemClient.readFile(this.path, i1, i2)
            this.#chunks[i] = content
            return this.#chunks[i]
        }
        catch(err) {
            console.error('Error fetching chunk', err)
            return undefined
        }
        finally {
            this.#fetchingChunks.delete(i)
        }
    }
}

export const concatenateArrayBuffers = (buffers: ArrayBuffer[]) => {
    if (buffers.length === 0) return new ArrayBuffer(0)
    if (buffers.length === 1) return buffers[0]
    const totalSize = buffers.reduce((prev, buffer) => (prev + buffer.byteLength), 0)
    const ret = new Uint8Array(totalSize)
    let pos = 0
    for (const buf of buffers) {
        ret.set(new Uint8Array(buf), pos)
        pos += buf.byteLength
    }
    return ret.buffer
}

async function sleepMsec(msec: number) {
    return new Promise(resolve => {
        setTimeout(resolve, msec)
    })
}

export default Qjb1Client