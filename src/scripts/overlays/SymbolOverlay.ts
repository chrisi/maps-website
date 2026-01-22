import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {Mode} from "@/model/mode.ts";

interface Symbol {
  id: number
  pt: Point
  sym: string
}

export class SymbolOverlay extends BaseOverlay {

  private symbols: Symbol[] = []
  private iconCache: Map<string, HTMLImageElement> = new Map()
  private gid = 0

  private dragSymbol: Symbol | undefined = undefined

  public init() {
    this.imcsClient?.onSymbolEvent((pos: Point, sym: string) => {
      const s: Symbol = {
        id: this.gid++, //TODO: this needs to be synced to be client-id save to avoid conflicts when deleting symbols
        sym: sym,
        pt: pos
      }
      this.symbols.push(s)
      this.redraw()
    })
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Symbol
  }

  public onDraw(cnv: Canvas): void {
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    this.symbols.forEach(sym => {
      this.drawSymbol(cnv, sym.pt, smartScale, sym.sym);
    })
  }

  public onPointerDown(e: PointerEvent, ownHotspots: Hotspot[]): void {
    if (e.button == 0 && ownHotspots.length > 0) {
      this.dragSymbol = ownHotspots[0]!.target as Symbol
    }
  }

  public onPointerMove(e: PointerEvent): void {
    if (!this.dragSymbol) return;
    this.dragSymbol.pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  public onPointerUp(e: PointerEvent, _: Hotspot[], isClick?: boolean): void {
    if (e.button == 0) {
      if (isClick && !this.dragSymbol) {
        const s: Symbol = {
          id: this.gid++,
          sym: this.global.selectedSymbol!,
          pt: this.fromCnv({x: e.pageX, y: e.pageY})
        }
        this.symbols.push(s)
        this.imcsClient!.msgSendSymbol(s.pt, s.sym)
        this.redraw()
      } else {
        this.dragSymbol = undefined
      }
    }
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
      img.onload = () => this.redraw()
      img.onerror = () => {
        console.warn(`Failed to load icon for ${symbol}`)
      }
      img.src = `../common/assets/${symbol}.ico`;
      this.iconCache.set(symbol, img);
    }

    if (img.complete && img.naturalWidth > 0) {
      const w = img.width * scale;
      const h = img.height * scale;
      const pt = this.toCnv(pos, cnv)
      cnv.context.drawImage(img, pt.x - w / 2, pt.y - h / 2, w, h);
    }
  }

}
