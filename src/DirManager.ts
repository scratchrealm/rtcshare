import fs from 'fs'
import { RtcshareDir, RtcshareFile } from './RtcshareRequest'

class DirManager {
    constructor(private dir: string) {
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
                if (isShareable(f)) {
                    const size = s.size
                    let content: string | undefined = undefined
                    if ((isTextType(f)) && (size <= 1000 * 1000)) {
                        content = await fs.promises.readFile(pp, 'utf8')
                    }
                    files.push({
                        name: f,
                        size,
                        mtime: s.mtime.getTime(),
                        content
                    })
                }
            }
        }

        return {files, dirs}
    }
    async clearOldData() {

    }
}

const textExtensions = ['txt', 'json', 'md']
const binExtensions = ['mp4', 'avi', 'ogv']

function isShareable(f: string) {
    const exts = [...textExtensions, ...binExtensions]
    const aa = f.split('.')
    const ee = aa[aa.length - 1]
    return exts.includes(ee)
}

function isTextType(f: string) {
    const exts = textExtensions
    const aa = f.split('.')
    const ee = aa[aa.length - 1]
    return exts.includes(ee)
}

export default DirManager