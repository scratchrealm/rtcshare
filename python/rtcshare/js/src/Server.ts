import crypto from 'crypto';
import express, { Express, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import * as http from 'http';
import YAML from 'js-yaml';
import { isRtcshareRequest, protocolVersion, RtcshareResponse } from './RtcshareRequest';
import OutgoingProxyConnection from './OutgoingProxyConnection';
import DirManager from './DirManager';
import getPeer from './RemotePeer';
import SignalCommunicator, { sleepMsec } from './SignalCommunicator';
import { handleApiRequest } from './handleApiRequest';
import createMessageWithBinaryPayload from './createMessageWithBinaryPayload';
import ServiceManager from './ServiceManager';
const allowedOrigins = ['https://figurl.org', 'https://scratchrealm.github.io', 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'https://neurosift.vercel.app']

class Server {
    #expressApp: Express
    #expressServer: http.Server
    #dirManager: DirManager
    #serviceManager: ServiceManager
    #outgoingProxyConnection: OutgoingProxyConnection | undefined
    constructor(private a: {port: number, dir: string, verbose: boolean, enableRemoteAccess: boolean, iceServers: any | undefined}) {
        this.#dirManager = new DirManager(a.dir)
        this.#serviceManager = new ServiceManager()
        this.#expressApp = express()
        this.#expressApp.use(express.json())
        this.#expressServer = http.createServer(this.#expressApp)
        this.#expressApp.use((req: Request, resp: Response, next: NextFunction) => {
            const origin = req.get('origin')
            const allowedOrigin = allowedOrigins.includes(origin) ? origin : undefined
            if (allowedOrigin) {
                resp.header('Access-Control-Allow-Origin', allowedOrigin)
                resp.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept")
            }
            next()
        })
        this.#expressApp.get('/probe', (req: Request, resp: Response) => {
            resp.status(200).send({protocolVersion})
        })
        this.#expressApp.post('/api', (req: Request, resp: Response) => {
            const request = req.body
            if (!isRtcshareRequest(request)) {
                resp.status(500).send('Invalid request')
                return
            }
            ;(async () => {
                let rrr: {response: RtcshareResponse, binaryPayload?: Buffer}
                try {
                    rrr = await handleApiRequest({request, dirManager: this.#dirManager, serviceManager: this.#serviceManager, signalCommunicator, options: {verbose: this.a.verbose, proxy: false}})
                }
                catch(err) {
                    resp.status(500).send(err.message)
                    return
                }
                const mm = createMessageWithBinaryPayload(rrr.response, rrr.binaryPayload)
                resp.status(200).send(Buffer.from(mm)) // important to convert to a buffer prior to sending
            })()
        })
        const signalCommunicator = new SignalCommunicator()
        // if (a.enableRemoteAccess) {
        signalCommunicator.onConnection(connection => { return getPeer(connection, this.#dirManager, this.#serviceManager, signalCommunicator, a.iceServers)})
        // }
        const urlLocal = `https://scratchrealm.github.io/rtcshare?sh=http://localhost:${this.a.port}`
        console.info('')
        console.info(`Connect on local machine: ${urlLocal}`)
        console.info('')
        if (a.enableRemoteAccess) {
            ;(async () => {
                console.info('Connecting to proxy')
                const {publicId, privateId} = await getServiceIdFromDir(this.a.dir)
                const outgoingProxyConnection = new OutgoingProxyConnection(publicId, privateId, this.#dirManager, this.#serviceManager, signalCommunicator, {verbose: this.a.verbose, webrtc: true})
                this.#outgoingProxyConnection = outgoingProxyConnection
                const proxyUrl = outgoingProxyConnection.url
                const urlRemote = `https://scratchrealm.github.io/rtcshare?sh=${proxyUrl}&webrtc=1`
                console.info('')
                console.info(`Connect on remote machine: ${urlRemote}`)
                console.info('')
            })()
        }
        // if (a.enableRemoteAccess) {
        //     this.#peerManager = new PeerManager(this.#outputManager, {verbose: this.a.verbose})
        //     this.#peerManager.start()
        // }
    }
    async stop() {
        return new Promise<void>((resolve) => {
            if (this.#outgoingProxyConnection) {
                this.#outgoingProxyConnection.close()
            }
            this.#expressServer.close((err) => {
                if (err) {console.warn(err)}
                resolve()
            })
        })
    }
    start() {
        this.#expressServer.listen(this.a.port, () => {
            return console.info(`Server is running on port ${this.a.port}`)
        })

        // clean up output manager periodically
        ;(async () => {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                await this.#dirManager.clearOldData()
                await sleepMsec(30 * 1000)
            }
        })()
    }
}

async function getServiceIdFromDir(dir: string): Promise<{publicId: string, privateId: string}> {
    const yamlPath = `${dir}/.rtcshare.yaml`
    let config: {[key: string]: any} = {}
    if (fs.existsSync(yamlPath)) {
        const yaml = await fs.promises.readFile(yamlPath, 'utf8')
        if (yaml) {
            config = YAML.load(yaml)
        }
    }
    if ((!config.publicId) || (!config.privateId)) {
        config.privateId = `${randomAlphaStringLower(40)}`
        config.publicId = sha1Hash(config.privateId).slice(0, 20)
        const newYaml = YAML.dump(config)
        await fs.promises.writeFile(yamlPath, newYaml)
    }
    return {publicId: config.publicId, privateId: config.privateId}
}

function sha1Hash(x: string) {
    const shasum = crypto.createHash('sha1')
    shasum.update(x)
    return shasum.digest('hex')
}

const randomAlphaStringLower = (num_chars: number) => {
    if (!num_chars) {
        /* istanbul ignore next */
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < num_chars; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

export default Server