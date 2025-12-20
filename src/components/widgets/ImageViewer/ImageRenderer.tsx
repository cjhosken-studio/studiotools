import ExrViewer from "./EXRViewer"


export default function ImageRenderer({ src }:{src: string}) {
    if (!src) return null;
    
    const clean = src.split("?")[0].split("#")[0];
    const ext = clean.split(".").pop()?.toLowerCase();

    switch (ext) {
        case "exr":
            return <ExrViewer src={src}/>;
        default:
            return <img src={src} draggable={false}/>;
    }
}