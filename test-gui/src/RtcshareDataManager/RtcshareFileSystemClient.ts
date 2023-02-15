import postApiRequest from "../postApiRequest"
import { isReadDirResponse, ReadDirRequest, RtcshareDir, RtcshareFile } from "../RtcshareRequest"

class RtcshareFileSystemClient {
    #rootDir?: RtcshareDir
    constructor() {}
    async readDir(path: string): Promise<RtcshareDir & {dirs: RtcshareDir[], files: RtcshareFile[]}> {
        if ((!path) || (path === '/')) {
            const rr = this.#rootDir
            if ((rr) && (hasDirsAndFiles(rr))) {
                return rr
            }
            else {
                const {dirs, files} = await this._retrieveDir('')
                const newRoot = {name: '', dirs, files}
                this.#rootDir = newRoot
                return newRoot
            }
        }
        const aa = path.split('/')
        const parentPath = aa.slice(0, aa.length - 1).join('/')
        const dirName = aa[aa.length - 1]
        const parentDir = await this.readDir(parentPath)
        const x = parentDir.dirs.find(a => (a.name === dirName))
        if (!x) throw Error(`Directory not found: ${path}`)
        if (hasDirsAndFiles(x)) {
            return x
        }
        else {
            const {dirs, files} = await this._retrieveDir(path)
            x.dirs = dirs
            x.files = files
            return {name: x.name, dirs, files}
        }
    }
    async _retrieveDir(path: string): Promise<{dirs: RtcshareDir[], files: RtcshareFile[]}> {
        const req: ReadDirRequest = {
            type: 'readDirRequest',
            path
        }
        const resp = await postApiRequest(req)
        if (!isReadDirResponse(resp)) {
            console.warn(resp)
            throw Error('Unexpected readDir response')
        }
        const {dirs, files} = resp
        return {dirs, files}
    }
}

function hasDirsAndFiles(dir: RtcshareDir): dir is RtcshareDir & {dirs: RtcshareDir[], files: RtcshareFile[]} {
    return dir.dirs !== undefined && dir.files !== undefined
}

export default RtcshareFileSystemClient