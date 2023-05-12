import { isRtcshareRequest, isRtcshareResponse, RtcshareRequest, RtcshareResponse } from "./RtcshareRequest"
import validateObject, { isEqualTo, isNumber, isString, optional } from "./validateObject"

export type RtcsharePeerRequest = {
    type: 'rtcsharePeerRequest'
    request: RtcshareRequest
    requestId: string
}

export const isRtcsharePeerRequest = (x: any): x is RtcsharePeerRequest => (
    validateObject(x, {
        type: isEqualTo('rtcsharePeerRequest'),
        request: isRtcshareRequest,
        requestId: isString
    })
)

export type RtcsharePeerResponse = {
    type: 'rtcsharePeerResponse'
    response?: RtcshareResponse
    error?: string
    requestId: string
}

export const isRtcsharePeerResponse = (x: any): x is RtcsharePeerResponse => (
    validateObject(x, {
        type: isEqualTo('rtcsharePeerResponse'),
        response: optional(isRtcshareResponse),
        error: optional(isString),
        requestId: isString
    })
)

export type RtcsharePeerResponsePart = {
    type: 'rtcsharePeerResponsePart'
    partIndex: number
    numParts: number
    response?: RtcshareResponse
    error?: string
    requestId: string
}

export const isRtcsharePeerResponsePart = (x: any): x is RtcsharePeerResponsePart => (
    validateObject(x, {
        type: isEqualTo('rtcsharePeerResponsePart'),
        partIndex: isNumber,
        numParts: isNumber,
        response: optional(isRtcshareResponse),
        error: optional(isString),
        requestId: isString
    })
)