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

/*
5/12/23
Today I experimented with the idea of supporting streaming responses,
but after a lot of work I decided to abandon that idea.
I want to put down some notes about why I decided to abandon it, so that I don't forget.
I implemented streaming responses by allowing binaryPayload to be BufferStream (a custom type).
Then the messages sent back would be ResponsePart messages, that would need to be reassembled by the client.
It was a lot of work to implement because I had to support all three mechanisms (direct http, http proxy, webrtc).
Then support the reassembly on the clients (rtcshare-gui and figurl-gui).
Things seemed to work, but it added a lot of complexity.
Then I realized that the same thing could be accomplished by simply having the clients request things in chunks,
and make multiple concurrent requests. This is simpler and puts more flexibility on the client/server communication.
Aside from the complexity, another reason to abandon the ideas was that it was even more complicated for serviceQuery
requests. That would be a lot of additional work.
Instead, it's best to just implement chunking options.
*/

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
