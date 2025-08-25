//import { useAppContext } from "../ContextProvider";

import "./Properties.css";
import Asset from "../../types/Asset";
import { formatVersion } from "../../utils/Format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

export default function PropertiesPanel(
    {
        selectedAsset,
        setSelectedAsset
    }:{
        selectedAsset: Asset | null
        setSelectedAsset: (asset: Asset | null) => void;
    }
) {
    // const { context, projectList, setContext, setProjectList } = useAppContext();

    return (
        <div id="properties">
            {selectedAsset && (<div id="properties-panel">
                <div id="properties-header">
                    <button> <FontAwesomeIcon icon={faClose} onClick={() => {setSelectedAsset(null)}}/> </button>
                </div>
                <div>
                    <img src={selectedAsset.getThumbnail()}></img>
                    {selectedAsset.name} | {formatVersion(selectedAsset.version)}
                    
                </div>
                <div className="row">
                    <button> Set as Published </button>
                    {selectedAsset.type === "usd" && (<button> Open in USDView </button>)}
                </div>
                <div>
                </div>
            </div>
            )}
        </div>
    );
}