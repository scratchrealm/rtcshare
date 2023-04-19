import { Refresh } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { useRtcshare } from "../useRtcshare";
import TextFileView from "./TextFileView";
import VideoFileView from "./VideoFileView/VideoFileView";
import YamlFileView from "./YamlFileView";

type Props = {
    path?: string
    width: number
    height: number
}

const topBarHeight = 45

const FileView: FunctionComponent<Props> = ({path, width, height}) => {
    const fileName = path ? path.split('/').slice(-1)[0] : ''

    const [refreshCode, setRefreshCode] = useState(0)

    const handleRefresh = useCallback(() => {
        setRefreshCode(c => (c + 1))
    }, [])

    const refreshButton = (
        <IconButton onClick={handleRefresh}><Refresh /></IconButton>
    )

    return (
        <div>
            <div style={{position: 'absolute', width, height: topBarHeight}}>
                {refreshButton} {fileName}
            </div>
            <div style={{position: 'absolute', width, top: topBarHeight, height: height - topBarHeight, overflow: 'auto'}}>
                <FileViewDocument
                    path={path}
                    width={width}
                    height={height - topBarHeight}
                    refreshCode={refreshCode}
                />
            </div>
        </div>
    )
}

type FileViewDocumentProps = {
    path?: string
    width: number
    height: number
    refreshCode: number
}

const FileViewDocument: FunctionComponent<FileViewDocumentProps> = ({path, refreshCode, width, height}) => {
    const [content, setContent] = useState<string>()

    const [status, setStatus] = useState<'waiting' | 'loading' | 'loaded' | 'error'>('waiting')
    const [error, setError] = useState<string>('')
    const {client} = useRtcshare()

    useEffect(() => {
        if (!client) return
        if (!path) return
        if (!isTextFileType(path)) {
            setStatus('loaded')
            setContent('')
            return // don't load content for non-text files
        }
        setStatus('loading')
        let canceled = false
        ; (async () => {
            try {
                const x = await client.readFile(path, undefined, undefined, {forceReload: true})
                if (canceled) return
                const dec = new TextDecoder()
                setContent(dec.decode(x))
                setStatus('loaded')
            }
            catch(err: any) {
                if (canceled) return
                setStatus('error')
                setError(err.message)
            }
        })()
        return () => {canceled = true}
    }, [path, client, refreshCode])

    if (!path) return <div>No path</div>
    if (status === 'waiting') return <div>waiting</div>
    if (status === 'loading') return <div style={{color: 'blue'}}>loading</div>
    if (status === 'error') return <div style={{color: 'red'}}>Error: {error}</div>

    if (content === undefined) {
        return <div style={{color: 'red'}}>no content</div>
    }
    if (path.endsWith('.yaml')) {
        return <YamlFileView content={content} path={path} />
    }
    else if (isTextFileType(path)) {
        return <TextFileView content={content} />
    }
    else if (isVideoFileType(path)) {
        return <VideoFileView path={path} width={width} height={height} />
    }
    else {
        return <div>No preview for file of this type</div>
    }
}

function isVideoFileType(path: string): boolean {
    const extensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv']
    for (const ext of extensions) {
        if (path.endsWith(ext)) return true
    }
    return false
}

function isTextFileType(path: string): boolean {
    const extensions = ['.txt', '.md', '.json', '.yaml']
    for (const ext of extensions) {
        if (path.endsWith(ext)) return true
    }
    return false
}

export default FileView