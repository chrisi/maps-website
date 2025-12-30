import type {Canvas} from "@/scripts/ov2/Canvas.ts";

export interface Overlay {
    isActive(): boolean

    onRedraw(cnv: Canvas): void
}

export abstract class BaseOverlay implements Overlay {
    public isActive(): boolean {
        return true
    }

    public abstract onRedraw(cnv: Canvas): void
}
