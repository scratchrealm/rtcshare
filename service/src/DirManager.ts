import fs from 'fs'
import YAML from 'js-yaml'
import { RtcshareDir, RtcshareFile } from './RtcshareRequest'

class DirManager {
    #config: {[k: string]: any}
    constructor(private dir: string) {
        const yamlPath = `${dir}/.rtcshare.yaml`
        this.#config = {}
        if (fs.existsSync(yamlPath)) {
            const yaml = fs.readFileSync(yamlPath, 'utf8')
            if (yaml) {
                this.#config = YAML.load(yaml)
            }
        }
    }
    async readDir(path: string): Promise<{files: RtcshareFile[], dirs: RtcshareDir[]}> {
        const files: RtcshareFile[] = []
        const dirs: RtcshareDir[] = []

        const p = path ? `${this.dir}/${path}` : this.dir
        const list = await fs.promises.readdir(p)
        for (const f of list) {
            const pp = `${p}/${f}`
            const s = await fs.promises.stat(pp)
            if (s.isDirectory()) {
                dirs.push({name: f})
            }
            else if (s.isFile()) {
                // don't do this because we want to use binary data for file contents
                // let content: string | undefined = undefined
                // if ((isTextType(f)) && (size <= 1000 * 1000)) {
                //     content = await fs.promises.readFile(pp, 'utf8')
                // }

                files.push({
                    name: f,
                    size: s.size,
                    mtime: s.mtime.getTime()
                })
            }
        }

        return {files, dirs}
    }
    async readFile(path: string, start: number | undefined, end: number | undefined): Promise<Buffer> {
        if (!isShareable(path)) {
            throw Error(`File not shareable: ${path}`)
        }
        if (start === undefined) {
            if (end !== undefined) throw Error('end is not undefined even though start is undefined')
            return await fs.promises.readFile(`${this.dir}/${path}`)
        }
        else {
            if (end === undefined) throw Error('end is undefined even though start is not undefined')
            const f = await fs.promises.open(`${this.dir}/${path}`, 'r')
            try {
                const buffer = Buffer.alloc(end - start)
                await f.read({buffer, position: start, length: end - start})
                return buffer
            }
            finally {
                f.close()
            }
        }
    }
    async writeFile(path: string, fileDataBase64: string) {
        if (!isWritable(path)) {
            throw Error(`File not writable: ${path}`)
        }
        const fileData = Buffer.from(fileDataBase64, 'base64')
        await fs.promises.writeFile(`${this.dir}/${path}`, fileData)
    }
    userHasWriteAccess(userId: string) {
        const users = (this.#config['users'] || []) as {userId: string, write: boolean}[]
        const user = users.find(u => (u.userId === userId))
        return ((user) && (user.write))
    }
    async clearOldData() {

    }
}

const textExtensions = ['txt', 'json', 'yaml', 'md', 'py', 'ts', 'tsx', 'rst', 'jsonl']
const binExtensions = ['qjb1']

function isShareable(f: string) {
    const bb = f.split('/')
    const fileName = bb[bb.length - 1]
    if (fileName === '.rtcshare.yaml') {
        // don't reveal the .rtcshare.yaml secret
        // note this is covered by '.' condition below, but we want to make extra-sure
        return false
    }
    if (fileName.startsWith('.')) {
        // don't show hidden files
        return false
    }
    const exts = [...textExtensions, ...binExtensions]
    const aa = fileName.split('.')
    const ext = aa[aa.length - 1]
    return exts.includes(ext)
}

function isWritable(f: string) {
    const bb = f.split('/')
    const fileName = bb[bb.length - 1]
    if (fileName === '.rtcshare.yaml') {
        // don't allow overwriting .rtcshare.yaml
        // note this is covered by '.' condition below, but we want to make extra-sure
        return false
    }
    if (fileName.startsWith('.')) {
        // don't allow overwriting of hidden files
        return false
    }
    const exts = [...textExtensions]
    const aa = fileName.split('.')
    const ext = aa[aa.length - 1]
    return exts.includes(ext)
}

export default DirManager