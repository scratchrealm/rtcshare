import { ChonkyActions, ChonkyFileActionData, FileArray, FileBrowser as ChonkyFileBrowser, FileList, FileNavbar } from 'chonky';
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useRtcshare } from "../useRtcshare";

type Props = {
    onOpenFile: (path: string) => void
    currentFolderPath: string
    setCurrentFolderPath: (path: string) => void
}

const FileBrowser: FunctionComponent<Props> = ({onOpenFile, currentFolderPath, setCurrentFolderPath}) => {
    const {client} = useRtcshare()
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
                const pp = join(`${currentFolderPath}`, `${x.name}`)
                ff.push({
                    id: pp,
                    name: x.name,
                    isDir: true
                })
            }
            for (const x of dir.files) {
                const pp = join(`${currentFolderPath}`, `${x.name}`)
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
            // open a file (like in the folder chain)
            const { targetFile, files } = data.payload;
            const fileToOpen = targetFile ?? files[0];
            if (fileToOpen) {
                if (fileToOpen.isDir) {
                    setCurrentFolderPath(fileToOpen.id === '/' ? '' : fileToOpen.id)
                }
                else {
                    onOpenFile(fileToOpen.id)
                }
            }
        }
        else if (data.id === ChonkyActions.MouseClickFile.id) {
            // single click a file
            const { file: fileToOpen } = data.payload;
            if (fileToOpen) {
                if (fileToOpen.isDir) {
                    setCurrentFolderPath(fileToOpen.id === '/' ? '' : fileToOpen.id)
                }
                else {
                    onOpenFile(fileToOpen.id)
                }
            }
        }
    }, [onOpenFile, setCurrentFolderPath])
    
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
}

function join(a: string, b: string) {
    if (!a) return b
    if (!b) return a
    return `${a}/${b}`
}

export default FileBrowser