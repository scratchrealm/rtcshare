import validateObject, { isEqualTo, isNumber, isString, optional } from "./validateObject"

export type RequestFromClient = {
    type: 'requestFromClient'
    request: any
    requestId: string
}

export const isRequestFromClient = (x: any): x is RequestFromClient => {
    return validateObject(x, {
        type: isEqualTo('requestFromClient'),
        request: () => (true),
        requestId: isString
    })
}

export type ResponseToClient = {
    type: 'responseToClient'
    requestId?: string // added when sending over websocket
    response: any
    error?: string
}

export const isResponseToClient = (x: any): x is ResponseToClient => {
    return validateObject(x, {
        type: isEqualTo('responseToClient'),
        response: () => (true),
        requestId: optional(isString),
        error: optional(isString)
    })
}

export type ResponseToClientPart = {
    type: 'responseToClientPart'
    requestId?: string // added when sending over websocket
    partIndex: number
    numParts: number
    response: any // this will only be set for partIndex == 0. The parts are in the binaryPayload
    error?: string
}

export const isResponseToClientPart = (x: any): x is ResponseToClientPart => {
    return validateObject(x, {
        type: isEqualTo('responseToClientPart'),
        partIndex: isNumber,
        numParts: isNumber,
        response: () => (true),
        requestId: optional(isString),
        error: optional(isString)
    })
}

export type InitializeMessageFromService = {
    type: 'initialize'
    serviceId: string
    servicePrivateId: string
    proxySecret: string
}

export const isInitializeMessageFromService = (x: any): x is InitializeMessageFromService => {
    return validateObject(x, {
        type: isEqualTo('initialize'),
        serviceId: isString,
        servicePrivateId: isString,
        proxySecret: isString
    })
}

export type AcknowledgeMessageToService = {
    type: 'acknowledge'
}

export const isAcknowledgeMessageToService = (x: any): x is AcknowledgeMessageToService => {
    return validateObject(x, {
        type: isEqualTo('acknowledge')
    })
}

export type PingMessageFromService = {
    type: 'ping'
}

export const isPingMessageFromService = (x: any): x is PingMessageFromService => {
    return validateObject(x, {
        type: isEqualTo('ping')
    })
}