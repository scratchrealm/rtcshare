import { FunctionComponent, useCallback, useEffect, useState } from "react";
import Splitter from "../components/Splitter";
import FileBrowser from "../FileBrowser/FileBrowser";
import FileView from "../FileView/FileView";
import useWindowDimensions from "../useWindowDimensions";
import useUrlState from "./useUrlState";

type Props = any

const Home: FunctionComponent<Props> = () => {
    const {width, height} = useWindowDimensions()
    const [currentFilePath, setCurrentFilePath] = useState<string>()
    const handleOpenFile = useCallback((path: string) => {
        setCurrentFilePath(path)
    }, [])
    const [currentFolderPath, setCurrentFolderPath] = useState('')

    const {updateUrlState, initialUrlState} = useUrlState()

    useEffect(() => {
        if (initialUrlState.folder) {
            setCurrentFolderPath(initialUrlState.folder)
        }
        if (initialUrlState.file) {
            setCurrentFilePath(initialUrlState.file)
        }
    }, [initialUrlState])

    useEffect(() => {
        updateUrlState({folder: currentFolderPath || ''})
    }, [currentFolderPath, updateUrlState])

    useEffect(() => {
        if (currentFilePath) {
            updateUrlState({file: currentFilePath})
        }
    }, [currentFilePath, updateUrlState])

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={Math.min(width / 2, 500)}
        >
            <FileBrowser
                onOpenFile={handleOpenFile}
                currentFolderPath={currentFolderPath}
                setCurrentFolderPath={setCurrentFolderPath}
            />
            <FileView path={currentFilePath} width={0} height={0} />
        </Splitter>
    )
}

export default Home