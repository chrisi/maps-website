import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {MilSymbol} from "@/model/overlays.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {Mode} from "@/model/mode.ts";
import {generateGuid} from "@/scripts/utils.ts";

export class SymbolOverlay extends BaseOverlay {

  private symbols: MilSymbol[] = []
  private iconCache: Map<string, HTMLImageElement> = new Map()

  private dragSymbol: MilSymbol | undefined = undefined

  public init() {
    this.imcsClient?.onSymbolEvent((symbols: MilSymbol[]) => {
      const incoming = symbols[0]!
      const existing = this.symbols.find(s => s.guid === incoming.guid)
      if (existing) {
        existing.pos = incoming.pos
        existing.sym = incoming.sym
      } else {
        this.symbols.push(incoming)
      }
      this.redraw()
    })
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Symbol
  }

  public onDraw(cnv: Canvas): void {
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    this.symbols.forEach(sym => {
      this.drawSymbol(cnv, sym.pos, smartScale, sym.sym);
    })
  }

  public onPointerDown(e: PointerEvent, ownHotspots: Hotspot[]): void {
    if (e.button == 0 && ownHotspots.length > 0) {
      this.dragSymbol = ownHotspots[0]!.target as MilSymbol
    }
  }

  public onPointerMove(e: PointerEvent): void {
    if (!this.dragSymbol) return;
    this.dragSymbol.pos = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  public onPointerUp(e: PointerEvent, _: Hotspot[], isClick?: boolean): void {
    if (e.button == 0) {
      if (isClick && !this.dragSymbol) {
        const s: MilSymbol = {
          guid: generateGuid(),
          sym: this.global.selectedSymbol!,
          pos: this.fromCnv({x: e.pageX, y: e.pageY})
        }
        this.symbols.push(s)
        this.imcsClient!.msgSendSymbol([s])
        this.redraw()
      } else {
        this.imcsClient!.msgSendSymbol([this.dragSymbol!])
        this.dragSymbol = undefined
      }
    }
  }

  public providesHotspots(): Hotspot[] {
    return this.symbols.map(s => {
      return {pos: s.pos, size: 15, target: s, name: s.sym, provider: 'SymbolOverlay', type: 'Mil-Symbol'}
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
