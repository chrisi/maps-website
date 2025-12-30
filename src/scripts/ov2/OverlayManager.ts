import type {Overlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {Point} from "@/model/base.ts";

export class OverlayManager {
    private overlays: Overlay[] = []

    public registerOverlay = (overlay: Overlay) => {
        this.overlays.push(overlay)
    }

    public redraw = (context: CanvasRenderingContext2D, offset: Point, scale: number): void => {
        for (const overlay of this.overlays) {
            try {
                if (overlay.isActive()) {
                    const cnv: Canvas = {
                        context: context,
                        offset: offset,
                        scale: scale
                    }
                    // const start = performance.now() // Start timing
                    overlay.onRedraw(cnv)
                    // const end = performance.now() // End timing
                    // console.trace(`Redraw of ${overlay.constructor.name} took ${(end - start).toFixed(2)} ms`)
                }
            } catch (err) {
                console.error(this.errorMessage(overlay) + ` on redraw with scale ${scale}.`, err);
            }
        }
    }

    private errorMessage = (overlay: Overlay, e?: Event): string => `error in overlay '${overlay.constructor.name}'${e ? ` on '${e.type}' event` : ''}`
}
