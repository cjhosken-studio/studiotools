import ImageRenderer from "./ImageRenderer";
import Timeline from "./Timeline";
import { useImageSequence } from "./useImageSequence";

import "./ImageViewer.css"

export default function ImageViewer({frames} : {frames: string[]}) {
    if (!frames) return;
    
    const isSequence = frames.length > 1;
    
    const seq = useImageSequence(frames, 24);

    return (
        <div className="image-viewer">
            <ImageRenderer src={isSequence ? seq.src : frames[0]}/>

            {isSequence && (
                <Timeline
                    frame={seq.frame}
                    max={frames.length}
                    playing={seq.playing}
                    onFrameChange={seq.setFrame}
                    onPlayToggle={() => seq.setPlaying(p => !p)}
                />
            )}
        </div>
    )
}