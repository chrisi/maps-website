import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import type {Point} from "@/model/base.ts";
import type {DrawingContext, OverlayContext} from "@/scripts/overlay.ts";
import {distance} from "@/scripts/math.ts";
import {Mode} from "@/model/mode.ts";

interface ScaledItem {
  symbol: Symbol
  pt: Point
}

interface Symbol {
  id: number
  pt: Point
  sym: string
}

export class SymbolOverlay extends BaseOverlay {

  private scaledItems: ScaledItem[] = []
  private hoverItem?: ScaledItem
  private iconCache: Map<string, HTMLImageElement> = new Map();

  private symbols: Symbol[] = []
  private gid = 0

  private selectSymbolEventHandler: ((name: Symbol) => void)[] = [];

  public onSelectSymbol(cb: ((name: Symbol) => void)) {
    this.selectSymbolEventHandler.push(cb);
  }

  constructor(ctx: OverlayContext) {
    super(ctx);
  }

  private translateList(list: Symbol[], scale: number): ScaledItem[] {
    return list.map(pt => this.translateSymbol(pt, scale));
  }

  private translateSymbol(s: Symbol, scale: number): ScaledItem {
    return {pt: {x: s.pt.x * scale, y: s.pt.y * scale}, symbol: s};
  }

  public onRedraw = (dc: DrawingContext) => {
    this.scaledItems = this.translateList(this.symbols, dc.absScale);
    const intelliScale = dc.absScale + (1 - dc.absScale) * 0.7
    this.scaledItems.forEach(sym => {
      this.drawSymbol(dc, sym.pt, intelliScale, sym.symbol.sym);
    })
  }

  public onMouseMove = (e: MouseEvent) => {
    if (this.global.mode != Mode.Symbol) return
    this.hoverItem = undefined;
    this.scaledItems.forEach(itm => {
      const d = distance(itm.pt, {x: e.pageX, y: e.pageY})
      if (d < 15) {
        this.hoverItem = itm
      }
    })
    this.ovlCtx.canvas.style.cursor = (this.hoverItem ? "pointer" : "default")
  }

  public onClick(e: MouseEvent) {
    if (this.global.mode != Mode.Symbol) return
    if (this.hoverItem) {
      this.selectSymbolEventHandler.forEach(cb => cb(this.hoverItem!.symbol!))
    } else {
      const s: Symbol = {
        id: this.gid++,
        sym: this.global.selectedSymbol!,
        pt: {
          x: e.pageX / this.global.zoom.factor,
          y: e.pageY / this.global.zoom.factor
        }
      }
      this.symbols.push(s)
      this.redraw()
    }
  }

  public onContextMenu = (e: MouseEvent) => {
    if (this.global.mode != Mode.Symbol) return
    if (this.hoverItem) {
      this.symbols = this.symbols.filter(s => s.id !== this.hoverItem!.symbol.id)
      this.redraw()
    }
  }

  private drawSymbol(dc: DrawingContext, pt: Point, scale: number, symbol: string) {
    let img = this.iconCache.get(symbol);
    if (!img) {
      img = new Image();
      img.src = `common/assets/${symbol}.ico`;
      this.iconCache.set(symbol, img);
    }

    if (img.complete && img.naturalWidth > 0) {
      const w = img.width * scale;
      const h = img.height * scale;
      dc.cnvCtx.drawImage(img, pt.x - w / 2, pt.y - h / 2, w, h);
    }
  }
}
