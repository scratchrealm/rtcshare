import fs from 'fs'
import YAML from 'js-yaml'
import axios from 'axios'

type ServiceConfig = {
    name: string
    url: string
}

class ServiceManager {
    #config: {[k: string]: any}
    #services: ServiceConfig[] = []
    constructor(private dir: string) {
        const yamlPath = `${dir}/.rtcshare.yaml`
        this.#config = {}
        if (fs.existsSync(yamlPath)) {
            const yaml = fs.readFileSync(yamlPath, 'utf8')
            if (yaml) {
                this.#config = YAML.load(yaml)
            }
        }
        this.#services = this.#config.services || []
    }
    async queryService(serviceName: string, query: any): Promise<{ result: any, binaryPayload?: Buffer | undefined }> {
        const service: ServiceConfig | undefined = this.#services.find(s => s.name === serviceName)
        if (!service) {
            throw Error(`Service not found: ${serviceName}`)
        }
        // get a binary response
        const response = await axios.post(service.url, query, { responseType: 'arraybuffer' })
        const responseData: ArrayBuffer | undefined = response.data
        if (!responseData) {
            throw Error('No response data')
        }
        if (!(responseData instanceof ArrayBuffer)) {
            throw Error('Unexpected response type. Expected ArrayBuffer.')
        }
        return {result: {success: true}, binaryPayload: Buffer.from(responseData)}
    }
}

export default ServiceManager