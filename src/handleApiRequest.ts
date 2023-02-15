import DirManager from "./DirManager";
import { isProbeRequest, isReadDirRequest, isWebrtcSignalingRequest, ProbeResponse, protocolVersion, ReadDirRequest, ReadDirResponse, RtcshareRequest, RtcshareResponse, WebrtcSignalingRequest, WebrtcSignalingResponse } from "./RtcshareRequest";
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


export const handleApiRequest = async (props: apiRequest): Promise<RtcshareResponse> => {
    const { request, dirManager, signalCommunicator, options } = props
    const webrtcFlag = options.webrtc ? "Webrtc" : ""

    if (isProbeRequest(request)) {
        return handleProbeRequest(options.proxy)
    }

    if (isReadDirRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} readDir`)
        return handleReadDirRequest(request, dirManager)
    }

    if (isWebrtcSignalingRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} webrtcSignalingRequest`)
        return handleWebrtcSignalingRequest(request, signalCommunicator)
    }

    throw Error('Unexpected request type')
}


const handleProbeRequest = async (usesProxy?: boolean): Promise<ProbeResponse> => {
    const response: ProbeResponse = {
        type: 'probeResponse',
        protocolVersion: protocolVersion,
        proxy: usesProxy
    }
    if (usesProxy) {
        response.proxy = true
    }
    return response
}


const handleReadDirRequest = async (request: ReadDirRequest, dirManager: DirManager): Promise<ReadDirResponse> => {
    const {files, dirs} = await dirManager.readDir(request.path)
    const response: ReadDirResponse = {type: 'readDirResponse', files, dirs}
    return response
}

const handleWebrtcSignalingRequest = async (request: WebrtcSignalingRequest, signalCommunicator: SignalCommunicator): Promise<WebrtcSignalingResponse> => {
    return await signalCommunicator.handleRequest(request)
}
