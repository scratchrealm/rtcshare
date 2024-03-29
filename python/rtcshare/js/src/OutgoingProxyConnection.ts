import WebSocket from 'ws'
import { InitializeMessageFromService, isAcknowledgeMessageToService, isRequestFromClient, PingMessageFromService, RequestFromClient, ResponseToClient } from './ConnectorHttpProxyTypes'
import { handleApiRequest } from './handleApiRequest'
import { isRtcshareRequest, RtcshareResponse } from './RtcshareRequest'
import DirManager from './DirManager'
import SignalCommunicator from './SignalCommunicator'
import createMessageWithBinaryPayload from './createMessageWithBinaryPayload'
import ServiceManager from './ServiceManager'

const proxyUrl = process.env['RTCSHARE_PROXY'] || `https://rtcshare-proxy.herokuapp.com`
const proxySecret = process.env['RTCSHARE_PROXY_SECRET'] || 'rtcshare-no-secret'

class OutgoingProxyConnection {
    #acknowledged: boolean
    #webSocket: WebSocket
    constructor(private serviceId: string, private servicePrivateId: string, private dirManager: DirManager, private serviceManager: ServiceManager, private signalCommunicator: SignalCommunicator, private o: {verbose: boolean, webrtc?: boolean}) {
        this.initializeWebSocket()
        const keepAlive = () => {
            if (this.#webSocket) {
                if (this.#acknowledged) {
                    const msg: PingMessageFromService = {
                        type: 'ping'
                    }
                    try {
                        this.#webSocket.send(JSON.stringify(msg))
                    }
                    catch(err) {
                        console.error(err)
                        console.warn('Problem sending ping message to proxy server')
                    }
                }
            }
            else {
                try {
                    this.initializeWebSocket()
                }
                catch(err) {
                    console.error(err)
                    console.warn('Problem initializing websocket')
                }
            }
            setTimeout(keepAlive, 20 * 1000)
        }
        setTimeout(keepAlive, 1000)
    }
    initializeWebSocket() {
        this.#acknowledged = false
        console.info(`Connecting to ${proxyUrl}`)
        const wsUrl = proxyUrl.replace('http:','ws:').replace('https:','wss:')
        const ws = new WebSocket(wsUrl)
        this.#webSocket = ws
        ws.on('open', () => {
            console.info('Connected')
            const msg: InitializeMessageFromService = {
                type: 'initialize',
                serviceId: this.serviceId,
                servicePrivateId: this.servicePrivateId,
                proxySecret: proxySecret
            }
            ws.send(JSON.stringify(msg))
        })
        ws.on('error', err => {
            console.warn(`Websocket error: ${err.message}`)
        })
        ws.on('close', () => {
            console.info('Websocket closed.')
            this.#webSocket = undefined
            this.#acknowledged = false
        })
        ws.on('message', msg => {                
            const messageJson = msg.toString()
            let message: any
            try {
                message = JSON.parse(messageJson)
            }
            catch(err) {
                console.error(`Error parsing message. Closing.`)
                ws.close()
                return
            }
            if (isAcknowledgeMessageToService(message)) {
                console.info('Connection acknowledged by proxy server')
                this.#acknowledged = true
                return
            }
            if (!this.#acknowledged) {
                console.info('Unexpected, message before connection acknowledged. Closing.')
                ws.close()
                return
            }
            if (isRequestFromClient(message)) {
                this.handleRequestFromClient(message)
            }
            else {
                console.warn(message)
                console.warn('Unexpected message from proxy server')
            }
        })
    }
    async handleRequestFromClient(request: RequestFromClient) {
        if (!this.#webSocket) return
        const rr = request.request
        if (!isRtcshareRequest(rr)) {
            const resp: ResponseToClient = {
                type: 'responseToClient',
                requestId: request.requestId,
                response: {},
                error: 'Invalid Rtcshare request'
            }
            this.#webSocket.send(JSON.stringify(resp))    
            return
        }
        let rtcshareResponse: {response: RtcshareResponse, binaryPayload?: Buffer}
        try {
            rtcshareResponse = await handleApiRequest({request: rr, dirManager: this.dirManager, serviceManager: this.serviceManager, signalCommunicator: this.signalCommunicator, options: {...this.o, proxy: true}})
        }
        catch(err) {
            const resp: ResponseToClient = {
                type: 'responseToClient',
                requestId: request.requestId,
                response: {},
                error: `Error handling request: ${err.message}`
            }
            this.#webSocket.send(JSON.stringify(resp))
            return
        }
        if (!this.#webSocket) return
        const responseToClient: ResponseToClient = {
            type: 'responseToClient',
            requestId: request.requestId,
            response: rtcshareResponse.response
        }
        const mm = createMessageWithBinaryPayload(responseToClient, rtcshareResponse.binaryPayload)
        this.#webSocket.send(mm)
    }
    public get url() {
        return `${proxyUrl}/s/${this.serviceId}`
    }
    close() {
        if (this.#webSocket) {
            this.#webSocket.close()
            this.#webSocket = undefined
        }
    }
}

export default OutgoingProxyConnection