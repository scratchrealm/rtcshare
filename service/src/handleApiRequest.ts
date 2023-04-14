import DirManager from "./DirManager";
import handleServiceQueryRequest from "./handleServiceQueryRequest";
import { isProbeRequest, isReadDirRequest, isReadFileRequest, isServiceQueryRequest, isWebrtcSignalingRequest, isWriteFileRequest, ProbeResponse, protocolVersion, ReadDirRequest, ReadDirResponse, ReadFileRequest, ReadFileResponse, RtcshareRequest, RtcshareResponse, WebrtcSignalingRequest, WebrtcSignalingResponse, WriteFileRequest, WriteFileResponse } from "./RtcshareRequest";
import ServiceManager from "./ServiceManager";
import SignalCommunicator from "./SignalCommunicator";

type apiRequestOptions = {
    verbose: boolean,
    webrtc?: boolean,
    proxy?: boolean
}

type apiRequest = {
    request: RtcshareRequest,
    dirManager: DirManager,
    serviceManager: ServiceManager,
    signalCommunicator: SignalCommunicator,
    options: apiRequestOptions
}


export const handleApiRequest = async (props: apiRequest): Promise<{response: RtcshareResponse, binaryPayload?: Buffer | undefined}> => {
    const { request, dirManager, serviceManager, signalCommunicator, options } = props
    const webrtcFlag = options.webrtc ? "Webrtc" : ""

    if (isProbeRequest(request)) {
        return handleProbeRequest(options.proxy)
    }

    if (isReadDirRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} readDir ${request.path}`)
        return handleReadDirRequest(request, dirManager)
    }

    if (isReadFileRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} readFile ${request.path}`)
        return handleReadFileRequest(request, dirManager)
    }

    if (isWriteFileRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} writeFile ${request.path}`)
        return handleWriteFileRequest(request, dirManager)
    }

    if (isServiceQueryRequest(request)) {
        options.verbose && console.info(`${webrtcFlag} serviceQuery`)
        return handleServiceQueryRequest(request, serviceManager)
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

const handleWriteFileRequest = async (request: WriteFileRequest, dirManager: DirManager): Promise<{response: WriteFileResponse}> => {
    if (!request.githubAuth.userId) {
        throw Error('No user ID')
    }
    if (!dirManager.userHasWriteAccess(request.githubAuth.userId)) {
        throw Error('User does not have write access to this rtcshare.')
    }
    const userId = await githubVerifyAccessToken(request.githubAuth.userId, request.githubAuth.accessToken)
    if (userId !== request.githubAuth.userId) {
        throw Error('Unexpected mismatch')
    }
    await dirManager.writeFile(request.path, request.fileDataBase64)
    const response: WriteFileResponse = {type: 'writeFileResponse'}
    return {response}
}

const handleWebrtcSignalingRequest = async (request: WebrtcSignalingRequest, signalCommunicator: SignalCommunicator): Promise<{response: WebrtcSignalingResponse}> => {
    return {response: await signalCommunicator.handleRequest(request)}
}

const githubVerifyAccessToken = async (userId: string, accessToken?: string) => {
    if (!accessToken) throw Error('No github access token *')
    const rr = await fetch(
        `https://api.github.com/user`,
        {
            method: 'GET',
            headers: {Authorization: `token ${accessToken}`}
        }
    )
    const resp = await rr.json()
    if (resp.login === userId) {
      return resp.login as string
    }
    else {
      throw Error('Incorrect user ID for access token')
    }
}
