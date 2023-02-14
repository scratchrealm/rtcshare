import { isRtcshareRequest, isRtcshareResponse, RtcshareRequest, RtcshareResponse } from "./RtcshareRequest"
import validateObject, { isEqualTo, isString } from "./validateObject"

export type RtcsharePeerRequest = {
    type: 'RtcsharePeerRequest'
    request: RtcshareRequest
    requestId: string
}

export const isRtcsharePeerRequest = (x: any): x is RtcsharePeerRequest => (
    validateObject(x, {
        type: isEqualTo('RtcsharePeerRequest'),
        request: isRtcshareRequest,
        requestId: isString
    })
)

export type RtcsharePeerResponse = {
    type: 'RtcsharePeerResponse'
    response: RtcshareResponse
    requestId: string
}

export const isRtcsharePeerResponse = (x: any): x is RtcsharePeerResponse => (
    validateObject(x, {
        type: isEqualTo('RtcsharePeerResponse'),
        response: isRtcshareResponse,
        requestId: isString
    })
)