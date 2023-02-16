import DirManager from "./DirManager";
import { isProbeRequest, isReadDirRequest, isReadFileRequest, isWebrtcSignalingRequest, ProbeResponse, protocolVersion, ReadDirRequest, ReadDirResponse, ReadFileRequest, ReadFileResponse, RtcshareRequest, RtcshareResponse, WebrtcSignalingRequest, WebrtcSignalingResponse } from "./RtcshareRequest";
import SignalCommunicator from "./SignalCommunicator";

type apiRequestOptions = {
    verbose: boolean,
    webrtc?: boolean,
    proxy?: boolean
}

type apiRequest = {
    request: RtcshareRequest,
    dirManager: DirManager,
    signalCommunicator: SignalCommunicator,
    options: apiRequestOptions
}


export const handleApiRequest = async (props: apiRequest): Promise<{response: RtcshareResponse, binaryPayload?: Buffer | undefined}> => {
    const { request, dirManager, signalCommunicator, options } = props
    const webrtcFlag = options.webrtc ? "Webrtc" : ""

    if (isProbeRequest(request)) {
        return handleProbeRequest(options.proxy)
    }

    if (isReadDirRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} readDir`)
        return handleReadDirRequest(request, dirManager)
    }

    if (isReadFileRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} readFileRequest`)
        return handleReadFileRequest(request, dirManager)
    }

    if (isWebrtcSignalingRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} webrtcSignalingRequest`)
        return handleWebrtcSignalingRequest(request, signalCommunicator)
    }

    throw Error('Unexpected request type')
}


const handleProbeRequest = async (usesProxy?: boolean): Promise<{response: ProbeResponse}> => {
    const response: ProbeResponse = {
        type: 'probeResponse',
        protocolVersion: protocolVersion,
        proxy: usesProxy
    }
    if (usesProxy) {
        response.proxy = true
    }
    return {response}
}


const handleReadDirRequest = async (request: ReadDirRequest, dirManager: DirManager): Promise<{response: ReadDirResponse}> => {
    const {files, dirs} = await dirManager.readDir(request.path)
    const response: ReadDirResponse = {type: 'readDirResponse', files, dirs}
    return {response}
}

const handleReadFileRequest = async (request: ReadFileRequest, dirManager: DirManager): Promise<{response: ReadFileResponse, binaryPayload: Buffer}> => {
    const buf = await dirManager.readFile(request.path, request.start, request.end)
    const response: ReadFileResponse = {type: 'readFileResponse'}
    return {response, binaryPayload: buf}
}

const handleWebrtcSignalingRequest = async (request: WebrtcSignalingRequest, signalCommunicator: SignalCommunicator): Promise<{response: WebrtcSignalingResponse}> => {
    return {response: await signalCommunicator.handleRequest(request)}
}
