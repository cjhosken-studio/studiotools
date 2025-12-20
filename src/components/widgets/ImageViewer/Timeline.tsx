export default function Timeline({
    frame,
    max,
    playing,
    onFrameChange,
    onPlayToggle
} : {
    frame:number,
    max:number,
    playing:boolean;
    onFrameChange: (f:number) => void;
    onPlayToggle:() => void;
}) {
    return <div className="timeline">
        <button onClick={onPlayToggle}> {playing ? "Pause" : "Play"} </button>
        <input
            type="range"
            min={0}
            max={max-1}
            value={frame}
            onChange={e => onFrameChange(Number(e.target.value))}
        />
        <span>{frame + 1} / {max}</span>
    </div>
}