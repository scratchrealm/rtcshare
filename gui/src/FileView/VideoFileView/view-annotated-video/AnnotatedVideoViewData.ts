import { isEqualTo, isNumber, isString, optional, validateObject } from "@figurl/core-utils"

export type AnnotatedVideoNode = {
    id: string
    label: string
    colorIndex?: number
}

export type AnnotatedVideoViewData = {
    type: 'misc.AnnotatedVideo',
    videoUri?: string
    videoWidth: number
    videoHeight: number
    videoNumFrames: number
    samplingFrequency: number
    annotationsUri?: string
    nodesUri?: string
    positionDecodeFieldUri?: string
}

export const isAnnotatedVideoViewData = (x: any): x is AnnotatedVideoViewData => {
    return validateObject(x, {
        type: isEqualTo('misc.AnnotatedVideo'),
        videoUri: optional(isString),
        videoWidth: isNumber,
        videoHeight: isNumber,
        videoNumFrames: isNumber,
        samplingFrequency: isNumber,
        annotationsUri: optional(isString),
        nodesUri: optional(isString),
        positionDecodeFieldUri: optional(isString)
    })
}