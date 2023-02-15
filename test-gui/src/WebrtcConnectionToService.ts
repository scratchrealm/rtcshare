import SimplePeer from "simple-peer";
import { isRtcsharePeerResponse, RtcsharePeerRequest } from "./RtcsharePeerRequest";
import { RtcshareRequest, RtcshareResponse, WebrtcSignalingRequest } from "./RtcshareRequest";
import postApiRequest from "./postApiRequest";

class WebrtcConnectionToService {
    #peer: SimplePeer.Instance | undefined
    #requestCallbacks: {[requestId: string]: (response: RtcshareResponse) => void} = {}
    #status: 'pending' | 'connected' | 'error' = 'pending'
    constructor() {
        const clientId = randomAlphaString(10)
        const peer = new SimplePeer({initiator: true})
        peer.on('signal', async s => {
            const request: WebrtcSignalingRequest = {
                type: 'webrtcSignalingRequest',
                clientId,
                signal: JSON.stringify(s)
            }
            const response = await postApiRequest(request)
            if (response.type !== 'webrtcSignalingResponse') {
                throw Error('Unexpected webrtc signaling response')
            }
            for (const sig0 of response.signals) {
                peer.signal(sig0)
            }
        })
        peer.on('connect', () => {
            console.info('Webrtc connection established')
            this.#status = 'connected'
        })
        peer.on('data', d => {
            const dd = JSON.parse(d)
            if (!isRtcsharePeerResponse(dd)) {
                console.warn(dd)
                throw Error('Unexpected peer response')
            }
            const cb = this.#requestCallbacks[dd.requestId]
            if (!cb) {
                console.warn('Got response, but no matching request ID callback')
                return
            }
            delete this.#requestCallbacks[dd.requestId]
            cb(dd.response)
        })
        this.#peer = peer
        ;(async () => {
            const timer = Date.now()
            while (this.#status === 'pending') {
                const elapsed = Date.now() - timer
                if (elapsed > 15000) {
                    this.#status = 'error'
                    console.warn('Unable to establish webrtc connection.')
                    break   
                }
                await sleepMsec(3000)
                if (this.#status === 'pending') {
                    const request: WebrtcSignalingRequest = {
                        type: 'webrtcSignalingRequest',
                        clientId,
                        signal: undefined
                    }
                    const response = await postApiRequest(request)
                    if (response.type !== 'webrtcSignalingResponse') {
                        throw Error('Unexpected webrtc signaling response')
                    }
                    for (const sig0 of response.signals) {
                        peer.signal(sig0)
                    }
                }
            }
        })()
    }
    async postApiRequest(request: RtcshareRequest): Promise<RtcshareResponse> {
        if (this.status === 'error') {
            throw Error('Error in webrtc connection')
        }
        while (this.status === 'pending') {
            await sleepMsec(100)
        }
        if (!this.#peer) throw Error('No peer')
        const peer = this.#peer
        const requestId = randomAlphaString(10)
        const rr: RtcsharePeerRequest = {
            type: 'rtcsharePeerRequest',
            request,
            requestId
        }
        return new Promise((resolve) => {
            this.#requestCallbacks[requestId] = (resp: RtcshareResponse) => {
                resolve(resp)
            }
            peer.send(JSON.stringify(rr))
        })
    }
    public get status() {
        return this.#status
    }
}

export const randomAlphaString = (num_chars: number) => {
    if (!num_chars) {
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    let text = ""
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < num_chars; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

export const sleepMsec = async (msec: number): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, msec)
    })
}

export default WebrtcConnectionToService