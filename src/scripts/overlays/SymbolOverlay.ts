import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {MilSymbol} from "@/model/overlays.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {OverlayMode} from "@/model/mode.ts";
import {generateGuid} from "@/scripts/utils.ts";
import {watch} from "vue";

export class SymbolOverlay extends BaseOverlay {

  private iconCache: Map<string, HTMLImageElement> = new Map()

  private dragSymbol: MilSymbol | undefined = undefined

  public init() {
    this.imcsClient?.onSymbolEvent((symbols: MilSymbol[]) => {
      symbols.forEach(s => {
        this.receiveSymbol(s)
      })
    })
    watch(() => this.settings.viz.wb, () => {
      this.redraw()
    })
  }

  public receiveSymbol(inSym: MilSymbol) {
    if (inSym.deleted) {
      const idx = this.global.whiteboard.symbols.findIndex(s => s.guid === inSym.guid)
      if (idx >= 0) this.global.whiteboard.symbols.splice(idx, 1)
    } else {
      const existing = this.global.whiteboard.symbols.find(s => s.guid === inSym.guid)
      if (existing) {
        existing.pos = inSym.pos
        existing.sym = inSym.sym
      } else
        this.global.whiteboard.symbols.push(inSym)
    }
    this.redraw()
  }

  public isEnabled(): boolean {
    return this.settings.viz.wb
  }

  public isActive(mode: OverlayMode): boolean {
    return mode == OverlayMode.Symbol
  }

  public onDraw(cnv: Canvas): void {
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    this.global.whiteboard.symbols.forEach(sym => {
      this.drawSymbol(cnv, sym.pos, smartScale, sym.sym);
    })
  }

  public onPointerDown(e: PointerEvent, ownHotspots: Hotspot[]): void {
    if (e.button == 0 && ownHotspots.length > 0) {
      this.dragSymbol = ownHotspots[0]!.target as MilSymbol
    }
  }

  public onPointerMove(e: PointerEvent): void {
    if (!this.dragSymbol) return
    this.dragSymbol.pos = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  public onPointerUp(e: PointerEvent, _: Hotspot[], isClick?: boolean): void {
    if (e.button == 0 && this.global.inputMode != "delete") {
      if (isClick && !this.dragSymbol) {
        const s: MilSymbol = {
          guid: generateGuid(),
          sym: this.global.selectedSymbol!,
          pos: this.fromCnv({x: e.pageX, y: e.pageY})
        }
        this.global.whiteboard.symbols.push(s)
        this.imcsClient!.msgSendSymbol([s])
        this.redraw()
      } else {
        if (this.dragSymbol)
          this.imcsClient!.msgSendSymbol([this.dragSymbol!])
        this.dragSymbol = undefined
      }
    }

    if (e.button == 2 || this.global.inputMode == "delete") {
      const delTgt = this.getHotspots().pop()
      if (delTgt) {
        const del = delTgt.target as MilSymbol
        del.deleted = true
        this.imcsClient!.msgSendSymbol([del])
        this.receiveSymbol(del)
      }
    }
  }

  public providesHotspots(): Hotspot[] {
    return this.global.whiteboard.symbols.map(s => {
      return {pos: s.pos, size: -18, target: s, name: s.sym, provider: 'SymbolOverlay', type: 'Mil-Symbol'}
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
      img.src = `../icons/mil/${symbol}.ico`;
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
