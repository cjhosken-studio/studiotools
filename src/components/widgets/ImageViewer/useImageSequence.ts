import {useEffect, useState} from "react";

export function useImageSequence(frames: string[], fps=24) {
    const [frame, setFrame] = useState(0);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (!playing) return;

        const interval = setInterval(() => {
            setFrame(f => (f + 1) % frames.length);
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [playing, fps, frames.length]);

    return {
        frame,
        setFrame,
        playing,
        setPlaying,
        src: frames[frame],
    };
}