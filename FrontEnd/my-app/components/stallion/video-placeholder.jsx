import { Maximize, Play, Volume2 } from "lucide-react";
export function VideoPlaceholder({ variant }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-[10px] bg-[radial-gradient(circle_at_30%_20%,#1f2530,#0f1215)]">
      {variant === "hero" && (
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0f1215]/70 px-3.5 py-1.5 text-xs tracking-wide text-white uppercase backdrop-blur-sm">
          <Volume2 size={13} /> Tap for Sound
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`flex items-center justify-center rounded-full border border-[#bafc0c]/60 bg-[#0f1215]/60 ${variant === "hero" ? "size-14" : "size-11"}`}
        >
          <Play
            size={variant === "hero" ? 20 : 16}
            className="text-[#bafc0c]"
          />
        </div>
      </div>
      {variant === "testimonial" && (
        <div className="absolute right-2.5 bottom-2.5 left-2.5 flex justify-between">
          <div className="flex size-7 items-center justify-center rounded-full bg-[#0f1215]/70">
            <Volume2 size={13} className="text-[#f0f0f0]" />
          </div>
          <div className="flex size-7 items-center justify-center rounded-full bg-[#0f1215]/70">
            <Maximize size={13} className="text-[#f0f0f0]" />
          </div>
        </div>
      )}
    </div>
  );
}
