import net from 'net'

type ServiceConfig = {
    name: string
    url: string
}

class ServiceManager {
    constructor() {
    }
    async queryService(serviceName: string, query: any, dir: string, userId?: string): Promise<{ result: any, binaryPayload?: Buffer | undefined }> {
        const req: any = {
            type: 'serviceQuery',
            serviceName,
            query,
            dir
        }
        if (userId) {
            req.userId = userId
        }
        const responseData = await sendPythonProgramRequest(req)

        const ii = responseData.indexOf('\n')
        if (ii === -1) {
            console.warn(responseData)
            throw Error('Invalid response from service. No newline found.')
        }
        if (ii === 0) {
            throw Error('Error in queryService: ' + responseData.subarray(1).toString())
        }
        const result = JSON.parse(responseData.subarray(0, ii).toString())
        const binaryPayload = responseData.subarray(ii + 1)

        return {result, binaryPayload}
    }
}

function sendPythonProgramRequest(request: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const port = parseInt(process.env.RTCSHARE_SOCKET_PORT);
        if (!port) {
            throw Error('RTCSHARE_SOCKET_PORT not set')
        }
        const client = new net.Socket()

        client.connect(port, "localhost", () => {
            client.write(JSON.stringify(request) + '\n')
        });

        const dataChunks: Buffer[] = []

        client.on("data", (data) => {
            dataChunks.push(data)
        });

        client.on("close", () => {
            const data = Buffer.concat(dataChunks)
            resolve(data)
        });

        client.on("error", (err) => {
            reject(err);
            client.destroy();
        });
    });
}

export default ServiceManager