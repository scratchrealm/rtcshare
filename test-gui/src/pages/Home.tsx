import { FunctionComponent, useCallback, useState } from "react";
import Splitter from "../components/Splitter";
import FileBrowser from "../FileBrowser/FileBrowser";
import FileView from "../FileView/FileView";
import useWindowDimensions from "../useWindowDimensions";

type Props = any

const Home: FunctionComponent<Props> = () => {
    const {width, height} = useWindowDimensions()
    const [currentFilePath, setCurrentFilePath] = useState<string>()
    const handleOpenFile = useCallback((path: string) => {
        setCurrentFilePath(path)
    }, [])
    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={Math.min(width / 2, 300)}
        >
            <FileBrowser onOpenFile={handleOpenFile} />
            <FileView path={currentFilePath} />
        </Splitter>
    )
}

export default Home