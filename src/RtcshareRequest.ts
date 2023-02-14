import validateObject, { isArrayOf, isBoolean, isEqualTo, isNumber, isOneOf, isString, optional } from "./validateObject"

export const protocolVersion = '0.1.0'

/////////////////////////////////////////////////////////////////////////
export type ProbeRequest = {
    type: 'ProbeRequest'
}

export const isProbeRequest = (x: any): x is ProbeRequest => (
    validateObject(x, {
        type: isEqualTo('ProbeRequest')
    })
)

export type ProbeResponse = {
    type: 'ProbeResponse'
    protocolVersion: string
    proxy?: boolean
}

export const isProbeResponse = (x: any): x is ProbeResponse => (
    validateObject(x, {
        type: isEqualTo('ProbeResponse'),
        protocolVersion: isString,
        proxy: optional(isBoolean)
    })
)

/////////////////////////////////////////////////////////////////////////
export type ReadDirRequest = {
    type: 'ReadDirRequest'
    path: string
}

export const isReadDirRequest = (x: any): x is ReadDirRequest => (
    validateObject(x, {
        type: isEqualTo('ReadDirRequest'),
        path: isString
    })
)

export type RtcshareDir = {
    name: string
}

export type RtcshareFile = {
    name: string
    size: number
    textContent?: string
}

export type ReadDirResponse = {
    type: 'ReadDirResponse'
    dirs: RtcshareDir[]
    files: RtcshareFile[]
}

export const isReadDirResponse = (x: any): x is ReadDirResponse => (
    validateObject(x, {
        type: isEqualTo('ReadDirResponse'),
        dirs: isArrayOf(y => (validateObject(y, {
            name: isString
        }))),
        files: isArrayOf(y => (validateObject(y, {
            name: isString,
            size: isNumber,
            textContent: optional(isString)
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