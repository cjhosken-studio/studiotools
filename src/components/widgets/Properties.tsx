import "./Properties.css";
import Asset from "../../types/Asset";
import { formatVersion } from "../../utils/Format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import ExrViewer from "./EXRViewer.tsx";
import { useEffect, useState } from "react";

export default function PropertiesPanel({
    selectedAsset,
    setSelectedAsset,
}: {
    selectedAsset: Asset | null;
    setSelectedAsset: (asset: Asset | null) => void;
}) {

    const [isExr, setIsExr] = useState<Boolean>(false);

    useEffect(() => {

        if (selectedAsset?.type === "images") {
            setIsExr(true);
        }
    }, [selectedAsset])

    return (
        <div id="properties">
            {selectedAsset && (
                <div id="properties-panel">
                    <div id="properties-header">
                        <button onClick={() => setSelectedAsset(null)}>
                            <FontAwesomeIcon icon={faClose} />
                        </button>
                    </div>

                    <div id="viewer">
                        {isExr ? (
                            <ExrViewer
                                src={selectedAsset.getThumbnail()}
                            />
                        ) : (
                            <img src={selectedAsset.getThumbnail()} />
                        )}

                        <div>
                            {selectedAsset.name} |{" "}
                            {formatVersion(selectedAsset.version)}
                        </div>
                    </div>

                    <div className="row">
                        <button>Set as Published</button>
                        {selectedAsset.type === "usd" && (
                            <button>Open in USDView</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
