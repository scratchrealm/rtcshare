import JsonlClient from "./JsonlClient"

type PositionDecodeFieldFrameRaw = {
    i: string // base64 representation of Uint16Array of indices
    v: string // base64 representation of Uint16Array of values
}

export type PositionDecodeFieldFrame = {
    indices: Uint16Array
    values: Uint16Array
}

export type PositionDecodeFieldHeader = {
    recordByteLengths: number[]
    bins: {x: number, y: number, w: number, h: number}[]
    maxValue: number
}

class PositionDecodeFieldClient {
    #jsonlClient: JsonlClient
    constructor(private uri: string) {
        this.#jsonlClient = new JsonlClient(uri)
    }
    async getFrame(frameIndex: number): Promise<undefined | PositionDecodeFieldFrame> {
        const d = await this.#jsonlClient.getFrame(frameIndex)
        if (d) {
            const dr = d as any as PositionDecodeFieldFrameRaw
            const indices = new Uint16Array(_base64ToArrayBuffer(dr.i))
            const values = new Uint16Array(_base64ToArrayBuffer(dr.v))
            return {
                indices,
                values
            }
        }
        else return undefined
    }
    async getHeader(): Promise<PositionDecodeFieldHeader | undefined> {
        const h = await this.#jsonlClient.getHeader()
        return h ? h as PositionDecodeFieldHeader : undefined
    }
}

function _base64ToArrayBuffer(base64: string) {
    var binary_string = window.atob(base64)
    var bytes = new Uint8Array(binary_string.length)
    for (var i = 0; i < binary_string.length; i++) {
        bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
}

export default PositionDecodeFieldClient