import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";

interface Symbol {
  id: number
  pt: Point
  sym: string
}

export class SymbolOverlay extends BaseOverlay {

  private symbols: Symbol[] = []
  private iconCache: Map<string, HTMLImageElement> = new Map();
  private gid = 0

  public onDraw(cnv: Canvas): void {
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    this.symbols.forEach(sym => {
      this.drawSymbol(cnv, sym.pt, smartScale, sym.sym);
    })
  }

  public onClick(e: MouseEvent): void {
    const s: Symbol = {
      id: this.gid++,
      sym: this.global.selectedSymbol!,
      pt: this.fromCnv({x: e.pageX, y: e.pageY})
    }
    this.symbols.push(s)
    this.redraw()
  }

  public onClickOwnHotspot(hotspots: Hotspot[]): void {
  }

  public onHoverOwnHotspot(hotspots: Hotspot[]): void {
  }

  public onPointerDown(e: PointerEvent): void {
  }

  public onPointerMove(e: PointerEvent): void {
  }

  public onPointerUp(e: PointerEvent): void {
  }

  public providesHotspots(): Hotspot[] {
    return this.symbols.map(s => {
      return {pos: s.pt, size: 15, target: s, name: s.sym, provider: 'SymbolOverlay', type: 'Mil-Symbol'}
    })
  }

  private drawSymbol(cnv: Canvas, pos: Point, scale: number, symbol: string) {
    let img = this.iconCache.get(symbol);
    if (!img) {
      img = new Image();
      img.src = `../common/assets/${symbol}.ico`;
      this.iconCache.set(symbol, img);
    }

    if (img.complete && img.naturalWidth > 0) {
      const w = img.width * scale;
      const h = img.height * scale;
      const pt = this.toCnv(pos)
      cnv.context.drawImage(img, pt.x - w / 2, pt.y - h / 2, w, h);
    }
  }

}
