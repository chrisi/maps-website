import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {Point} from "@/model/base.ts";
import type {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";

export class RouteOverlay extends BaseOverlay {

    private readonly route: Point[]

    constructor(manager: OverlayManager) {
        super(manager);
        this.route = [
            {x: 1000, y: 800},
            {x: 2000, y: 1500},
            {x: 2800, y: 3700},
            {x: 5600, y: 5600},
            {x: 300, y: 3800},
            {x: 1000, y: 800}
        ]
    }

    public onDraw(cnv: Canvas): void {
        const {context, offset, scale} = cnv;
        if (this.route.length < 2) return;

        context.beginPath();
        context.strokeStyle = "white";
        context.lineWidth = 2;

        for (let i = 0; i < this.route.length; i++) {
            const p = this.route[i];
            if (p) {
                const x = (p.x - offset.x) * scale;
                const y = (p.y - offset.y) * scale;

                if (i === 0) {
                    context.moveTo(x, y);
                } else {
                    context.lineTo(x, y);
                }
            }
        }
        context.stroke();

        for (const p of this.route) {
            this.drawWaypoint(p, cnv);
        }
    }

    private drawWaypoint(pos: Point, cnv: Canvas): void {
        const {context, offset, scale} = cnv;
        const x = (pos.x - offset.x) * scale;
        const y = (pos.y - offset.y) * scale -3;
        const size = 8;

        context.beginPath();
        context.moveTo(x, y - size);
        context.lineTo(x - size, y + size);
        context.lineTo(x + size, y + size);
        context.closePath();

        context.lineJoin = "round";
        context.strokeStyle = "black";
        context.lineWidth = 4;
        context.stroke();
        context.strokeStyle = "white";
        context.lineWidth = 2;
        context.stroke();
    }
}
