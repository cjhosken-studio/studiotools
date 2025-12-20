import "./Properties.css";
import Asset from "../../types/Asset";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import ImageViewer from "./ImageViewer/ImageViewer.tsx";
import { formatVersion } from "../../utils/Format.tsx";

export default function PropertiesPanel({
    selectedAsset,
    setSelectedAsset,
}: {
    selectedAsset: Asset | null;
    setSelectedAsset: (asset: Asset | null) => void;
}) {

    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        if (!selectedAsset) {
            setImages([]);
            return;
        }
        
        const load = async () => {
            if (selectedAsset.type === "images") {
                const frames = await selectedAsset.getImages();
                setImages(frames);
            } else {
                setImages(selectedAsset.getThumbnail());
            }
        }

        load();
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

                    {selectedAsset.name} | {formatVersion(selectedAsset.version)}

                    <ImageViewer frames={images}/>

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
