import { Star } from "lucide-react";

export function StarRating({ size = 16 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="fill-[#bafc0c] text-[#bafc0c]" />
        ))}
      </div>
      <span className="text-sm text-[#d1d5db]">
        4.9 rating &middot; 200+ agencies helped
      </span>
    </div>
  );
}
