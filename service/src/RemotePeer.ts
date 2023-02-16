import SimplePeer from 'simple-peer';
import wrtc from 'wrtc';
import createMessageWithBinaryPayload from './createMessageWithBinaryPayload';
import DirManager from './DirManager';
import { handleApiRequest } from './handleApiRequest';
import { isRtcsharePeerRequest, RtcsharePeerResponse } from './RtcsharePeerRequest';
import SignalCommunicator, { SignalCommunicatorConnection } from './SignalCommunicator';

type callbackProps = {
    peer: SimplePeer.Instance,
    id: string,
    cnxn: SignalCommunicatorConnection,
    dirMgr: DirManager,
    signalCommunicator: SignalCommunicator
}

const maxWebrtcMessageLength = 32000 // how to choose this?


const getPeer = (connection: SignalCommunicatorConnection, dirMgr: DirManager, signalCommunicator: SignalCommunicator) => {
    const peer = new SimplePeer({initiator: false, wrtc})
    const id = Math.random().toString(36).substring(2, 10)
    const props: callbackProps = {
        peer,
        id,
        cnxn: connection,
        dirMgr,
        signalCommunicator
    }
    peer.on('data', d => onData(d, props))
    peer.on('signal', s => onPeerSignal(s, props))
    peer.on('error', e => onError(e, props))
    peer.on('connect', () => {
        console.info(`webrtc peer ${id} connected`)
    })
    peer.on('close', () => onClose(props))
    connection.onSignal(signal => onConnectionSignal(signal, props))

    return peer
}

const onData = (d: ArrayBuffer, props: callbackProps) => {
    const { peer, id, cnxn, dirMgr, signalCommunicator } = props
    const dec = new TextDecoder()
    const peerRequest = JSON.parse(dec.decode(d))
    if (!isRtcsharePeerRequest(peerRequest)) {
        console.warn('Invalid webrtc peer request. Disconnecting.')
        try {
            peer.destroy()
        } catch(err) {
            console.error(err)
            console.warn(`\tProblem destroying webrtc peer ${id} in response to bad peer request.`)
        }
        cnxn.close()
        return
    }
    handleApiRequest({request: peerRequest.request, dirManager: dirMgr, signalCommunicator, options: {verbose: true, webrtc: true}}).then(({response, binaryPayload}) => {
        const resp: RtcsharePeerResponse = {
            type: 'rtcsharePeerResponse',
            response,
            requestId: peerRequest.requestId
        }
        try {
            if (cnxn.wasClosed()) {
                console.warn(`\tSignal communicator connection was closed before the response could be sent.`)
            } else {
                const mm = createMessageWithBinaryPayload(resp, binaryPayload)
                if (mm.byteLength > maxWebrtcMessageLength) {
                    sendMessageInParts(peer, mm)
                }
                else {
                    peer.send(mm)
                }
            }
        } catch(err) {
            console.error(err)
            console.warn(`\tProblem sending API response to webrtc peer ${id}.`)
        }
    }).catch(err => {
        const resp: RtcsharePeerResponse = {
            type: 'rtcsharePeerResponse',
            error: err.message,
            requestId: peerRequest.requestId
        }
        const mm = createMessageWithBinaryPayload(resp)
        peer.send(mm)
    })
}

function sendMessageInParts(peer: SimplePeer.Instance, msg: ArrayBuffer) {
    const maxPartSize = maxWebrtcMessageLength
    const N = msg.byteLength
    const numParts = Math.ceil(N / maxPartSize)
    const multipartId = randomAlphaString(10)
    for (let i = 0; i < numParts; i++) {
        const enc = new TextEncoder()
        const partMessage = concatenateArrayBuffers([
            enc.encode(`/multipart/${multipartId}/${i}/${numParts}/`).buffer,
            msg.slice(i * maxPartSize, (i + 1) * maxPartSize)
        ])
        peer.send(partMessage)
    }
}

const onClose = (props: callbackProps) => {
    const { peer, id, cnxn } = props

    console.info(`webrtc peer ${id} disconnected`)
    peer.removeAllListeners('data')
    peer.removeAllListeners('signal')
    peer.removeAllListeners('connect')
    peer.removeAllListeners('close')
    cnxn.close()
}


const onPeerSignal = (s: SimplePeer.SignalData, props: callbackProps) => {
    props.cnxn.sendSignal(JSON.stringify(s))
}


const onError = (e: Error, props: callbackProps) => {
    const { peer, cnxn, id } = props
    console.error('Error in webrtc peer', e.message)
    try {
        peer.destroy()
    } catch(err) {
        console.error(err)
        console.warn(`\tProblem destroying webrtc peer ${id} in response to peer error.`)
    }
    cnxn.close()
}


const onConnectionSignal = (signal: string, props: callbackProps) => {
    const { peer, id } = props
    try {
        peer.signal(JSON.parse(signal))
    } catch(err) {
        console.error(err)
        console.warn(`\tProblem sending signal to webrtc peer ${id}.`)
    }
}

const concatenateArrayBuffers = (buffers: ArrayBuffer[]) => {
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

const randomAlphaString = (num_chars: number) => {
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

export default getPeer
