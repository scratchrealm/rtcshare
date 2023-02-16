import { FunctionComponent } from "react";
import Qjb1View from "../Qjb1View/Qjb1View";
import TextFileView from "./TextFileView";

type Props = {
    path?: string
    width: number
    height: number
}

const FileView: FunctionComponent<Props> = ({path, width, height}) => {
    if (!path) return <div>No path</div>
    if (path.endsWith('.qjb1')) {
        return <Qjb1View path={path} width={width} height={height} />
    }
    return <TextFileView path={path} />
}

export default FileView