import Image from "next/image";
import { brandConfig } from "@/config/brand";
import { cn } from "@/lib/utils";
// "lockup" is the horse mark + wordmark, for headers; "mark" is the horse
// alone, for the background watermark. File paths and dimensions live in
// config/brand.ts. Always pass a height class; width stays auto.
export function StallionLogo({ variant = "lockup", className, priority = false, }) {
    const asset = variant === "lockup" ? brandConfig.lockup : brandConfig.mark;
    return (<Image src={asset.src} width={asset.width} height={asset.height} alt={asset.alt} priority={priority} aria-hidden={asset.alt === "" || undefined} className={cn("w-auto", className)}/>);
}
