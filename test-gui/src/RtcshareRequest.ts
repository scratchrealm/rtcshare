import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

export const protocolVersion = '0.1.0'

export type RtcshareFile = {
    name: string
    size: number
    mtime: number
    content?: string | Buffer | ArrayBuffer | undefined
}

export type RtcshareDir = {
    name: string
    files?: RtcshareFile[]
    dirs?: RtcshareDir[]
}

/////////////////////////////////////////////////////////////////////////
export type ProbeRequest = {
    type: 'probeRequest'
}

export const isProbeRequest = (x: any): x is ProbeRequest => (
    validateObject(x, {
        type: isEqualTo('probeRequest')
    })
)

export type ProbeResponse = {
    type: 'probeResponse'
    protocolVersion: string
    proxy?: boolean
}

export const isProbeResponse = (x: any): x is ProbeResponse => (
    validateObject(x, {
        type: isEqualTo('probeResponse'),
        protocolVersion: isString,
        proxy: optional(isBoolean)
    })
)

/////////////////////////////////////////////////////////////////////////
export type ReadDirRequest = {
    type: 'readDirRequest'
    path: string
}

export const isReadDirRequest = (x: any): x is ReadDirRequest => (
    validateObject(x, {
        type: isEqualTo('readDirRequest'),
        path: isString
    })
)

export type ReadDirResponse = {
    type: 'readDirResponse'
    dirs: RtcshareDir[]
    files: RtcshareFile[]
}

export const isReadDirResponse = (x: any): x is ReadDirResponse => (
    validateObject(x, {
        type: isEqualTo('readDirResponse'),
        dirs: isArrayOf(y => (validateObject(y, {
            name: isString
        }))),
        files: isArrayOf(y => (validateObject(y, {
            name: isString,
            size: isNumber,
            mtime: isNumber,
            content: optional(isString)
        })))
    })
)

/////////////////////////////////////////////////////////////////////////
export type WebrtcSignalingRequest = {
    type: 'webrtcSignalingRequest'
    clientId: string
    signal?: string
}

export const isWebrtcSignalingRequest = (x: any): x is WebrtcSignalingRequest => (
    validateObject(x, {
        type: isEqualTo('webrtcSignalingRequest'),
        clientId: isString,
        signal: optional(isString)
    })
)

export type WebrtcSignalingResponse = {
    type: 'webrtcSignalingResponse'
    signals: string[]
}

export const isWebrtcSignalingResponse = (x: any): x is WebrtcSignalingResponse => (
    validateObject(x, {
        type: isEqualTo('webrtcSignalingResponse'),
        signals: isArrayOf(isString)
    })
)

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

export type RtcshareRequest =
    ProbeRequest |
    ReadDirRequest |
    WebrtcSignalingRequest

export const isRtcshareRequest = (x: any): x is RtcshareRequest => (
    isOneOf([
        isProbeRequest,
        isReadDirRequest,
        isWebrtcSignalingRequest
    ])(x)
)

export type RtcshareResponse =
    ProbeResponse |
    ReadDirResponse |
    WebrtcSignalingResponse

export const isRtcshareResponse = (x: any): x is RtcshareResponse => (
    isOneOf([
        isProbeResponse,
        isReadDirResponse,
        isWebrtcSignalingResponse
    ])(x)
)