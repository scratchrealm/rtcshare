import { FigurlRequest, FigurlResponse, isFigurlRequest } from "@figurl/interface/dist/viewInterface/FigurlRequestTypes";
import FigurlYaml from "../FileView/FigurlYaml";
import RtcshareFileSystemClient from "../RtcshareDataManager/RtcshareFileSystemClient";
import { randomAlphaString } from "../WebrtcConnectionToService";
import deserializeReturnValue from "./deserializeReturnValue";

const messageListeners: {[figureId: string]: (msg: any) => void} = {}

function addMessageListener(figureId: string, callback: (msg: any) => void) {
    messageListeners[figureId] = callback
}

window.addEventListener('message', (e: MessageEvent) => {
    const msg = e.data
    if ((msg) && (msg.type === 'figurlRequest')) {
        if (msg.figureId in messageListeners) {
            messageListeners[msg.figureId](msg)
        }
    }
})

class FigurlWindow {
    #figureId = randomAlphaString(10)
    #window: Window | null = null
    constructor(private figurlYaml: FigurlYaml, private baseDir: string, private fileSystemClient: RtcshareFileSystemClient) {
        const viewUrl = `${urlFromUri(figurlYaml.v)}/index.html?parentOrigin=${window.origin}&figureId=${this.#figureId}&useOpener=1`
        this.#window = window.open(viewUrl, '_blank')
        addMessageListener(this.#figureId, (msg: any) => {
            if (!this.#window) return
            ;(async () => {
                const req = msg.request
                if (isFigurlRequest(req)) {
                    const response = await this._handleFigurlRequest(req)
                    if (response) {
                        this.#window?.postMessage({
                            type: 'figurlResponse',
                            requestId: msg.requestId,
                            response
                        }, '*')
                    }
                }
                else {
                    console.warn(req)
                    console.warn('Invalid figurl request from window')
                }
            })()
        })
    }
    async _handleFigurlRequest(req: FigurlRequest): Promise<FigurlResponse | undefined> {
        if (req.type === 'getFigureData') {
            if (typeof(this.figurlYaml.d) === 'string') {
                const a = await this._loadFileBinary(this.figurlYaml.d, undefined, undefined)
                const dec = new TextDecoder()
                const figureData = await deserializeReturnValue(JSON.parse(dec.decode(a)))
                return {
                    type: 'getFigureData',
                    figureData
                }
            }
            else {
                return {
                    type: 'getFigureData',
                    figureData: this.figurlYaml.d
                }
            }
        }
        else if (req.type === 'getFileData') {
            const a = await this._loadFileBinary(req.uri, req.startByte, req.endByte)
            const rt = req.responseType || 'json-deserialized'
            let fileData
            const dec = new TextDecoder()
            if (rt === 'json-deserialized') {
                if (req.startByte !== undefined) {
                    throw Error('Cannot use startByte/endByte for json-serialized response type')
                }
                fileData = await deserializeReturnValue(JSON.parse(dec.decode(a)))
            }
            else if (rt === 'json') {
                if (req.startByte !== undefined) {
                    throw Error('Cannot use startByte/endByte for json response type')
                }
                fileData = JSON.parse(dec.decode(a))
            }
            else if (rt === 'binary') {
                fileData = a
            }
            else { // text
                fileData = dec.decode(a)
            }
            return {
                type: 'getFileData',
                fileData
            }
        }
    }
    async _loadFileBinary(d: string, startByte: number | undefined, endByte: number | undefined) {
        const d2 = d.split('$dir/').join(this.baseDir + '/')
        const dContent = await this.fileSystemClient.readFile(d2, startByte, endByte)
        return dContent
    }
}

const urlFromUri = (uri: string) => {
    if (uri.startsWith('gs://')) {
        const p = uri.slice("gs://".length)
        return `https://storage.googleapis.com/${p}`
    }
    else return uri
}

export default FigurlWindow