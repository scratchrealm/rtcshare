import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import {FileBrowser as ChonkyFileBrowser, FileArray, FileNavbar, FileList, ChonkyActions, ChonkyFileActionData, FileHelper} from 'chonky'
import { useRtcshare } from "../useRtcshare";

type Props = any

const FileBrowser: FunctionComponent<Props> = () => {
    const {client} = useRtcshare()
    const [currentFolderPath, setCurrentFolderPath] = useState('')
    const [files, setFiles] = useState<FileArray>([])

    const folderChain: FileArray = useMemo(() => {
        const ret: FileArray = []
        ret.push({id: '/', name: 'root', isDir: true})
        if (!currentFolderPath) return ret
        const a = currentFolderPath.split('/')
        for (let i = 0; i < a.length; i++) {
            const p = a.slice(0, i + 1).join('/')
            ret.push({
                id: p,
                name: a[i],
                isDir: true
            })
        }
        return ret
    }, [currentFolderPath])

    useEffect(() => {
        setFiles([])
        if (!client) return
        let canceled = false
        ;(async () => {
            const dir = await client.readDir(currentFolderPath)
            if (canceled) return
            const ff: FileArray = []
            for (const x of dir.dirs) {
                const pp = `${currentFolderPath}/${x.name}`
                ff.push({
                    id: pp,
                    name: x.name,
                    isDir: true
                })
            }
            for (const x of dir.files) {
                const pp = `${currentFolderPath}/${x.name}`
                ff.push({
                    id: pp,
                    name: x.name,
                    size: x.size,
                    modDate: new Date(x.mtime),
                    isDir: false
                })
            }
            setFiles(ff)
        })()
        return () => {canceled = true}
    }, [currentFolderPath, client])

    const handleFileAction = useCallback((data: ChonkyFileActionData) => {
        if (data.id === ChonkyActions.OpenFiles.id) {
            const { targetFile, files } = data.payload;
            const fileToOpen = targetFile ?? files[0];
            if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
                setCurrentFolderPath(fileToOpen.id)
                return
            }
        }
    }, [])
    
    return (
        <ChonkyFileBrowser
            files={files}
            folderChain={folderChain}
            defaultFileViewActionId={ChonkyActions.EnableListView.id}
            onFileAction={handleFileAction}
        >
            <FileNavbar />
            {/* <FileToolbar /> */}
            <FileList />
        </ChonkyFileBrowser>
    )
    return <div>File browser</div>
}

export default FileBrowser