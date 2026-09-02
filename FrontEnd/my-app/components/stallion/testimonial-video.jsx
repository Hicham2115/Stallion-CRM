"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

export function TestimonialVideo({ src, poster }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function handlePlay() {
    setPlaying(true);
    videoRef.current?.play();
  }

  return (
    <div className="relative aspect-3/4 overflow-hidden rounded-[10px] bg-[radial-gradient(circle_at_30%_20%,#1f2530,#0f1215)]">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={playing}
        playsInline
        preload="none"
        className="size-full object-cover"
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label="Play testimonial video"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex size-11 items-center justify-center rounded-full border border-[#bafc0c]/60 bg-[#0f1215]/60">
            <Play size={16} className="text-[#bafc0c]" />
          </div>
        </button>
      )}
    </div>
  );
}
