//import { useAppContext } from "../ContextProvider";

import "./Properties.css";
import Asset from "../../types/Asset";

export default function PropertiesPanel(
    {
        asset
    }:{
        asset: Asset | null
    }
) {
    // const { context, projectList, setContext, setProjectList } = useAppContext();

    return (
        <div id="properties">
            {asset && (<div id="properties-panel">
                <img src={asset.getThumbnail()}></img>
                {asset.name}
                {asset.version}
            </div>
            )}
        </div>
    );
}