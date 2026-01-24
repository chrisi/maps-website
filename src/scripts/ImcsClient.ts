import {useGlobalStore} from "@/stores/global.ts";
import type {Point} from "@/model/base.ts";
import type {MilSymbol, WbDraw} from "@/model/overlays.ts";
import type {CollabSettings} from "@/model/settings.ts";

enum ImcsMsgId {
  Auth = 0,
  Bullseye = 1,
  Symbol = 2,
  Line = 3,
  Ellipse = 4,
  Marker = 5,
  Text = 6,
  Erase = 7,
  Whiteboard = 8,
  Pointer = 9,
  Ping = 10,
  Draw = 11,
}

interface ImcsMsg {
  id: ImcsMsgId;
  client: number;
}

export interface ImcsMsgAuthRequest extends ImcsMsg {
  callsign: string
  session: string
}

export interface ImcsMsgAuthResult extends ImcsMsg {
  result: number
}

export interface ImcsMsgPos extends ImcsMsg {
  pos?: Point
}

export interface ImcsMsgSymbol extends ImcsMsg {
  symbols: MilSymbol[]
}

export interface ImcsMsgDraw extends ImcsMsg {
  parts: WbDraw[]
}

export interface ImcsMsgWhiteboard extends ImcsMsg {
  dataUrl: string
}

export class ImcsClient {

  private drawEventHandler: ((parts: WbDraw[]) => void)[] = [];

  public onDrawEvent(cb: ((parts: WbDraw[]) => void)) {
    this.drawEventHandler.push(cb);
  }

  private symbolEventHandler: ((symbols: MilSymbol[]) => void)[] = [];

  public onSymbolEvent(cb: ((symbols: MilSymbol[]) => void)) {
    this.symbolEventHandler.push(cb);
  }

  private pointerEventHandler: ((pt?: Point) => void)[] = [];

  public onPointerEvent(cb: ((pt?: Point) => void)) {
    this.pointerEventHandler.push(cb);
  }

  private bullseyePosEventHandler: ((pt: Point) => void)[] = [];

  public onBullseyePosEvent(cb: ((pt: Point) => void)) {
    this.bullseyePosEventHandler.push(cb);
  }

  private global = useGlobalStore()

  private IMCS_DEBUG = true;

  private socket: WebSocket | undefined = undefined
  private session: string = ""
  private callsign: string = ""
  private client: number = -1
  private timer: number = -1

  public connect(conn: CollabSettings) {
    if (this.socket) return;
    const url = `ws${conn.secure ? 's' : ''}://${conn.host}:${conn.port}`
    this.socket = new WebSocket(url);
    this.socket.addEventListener("open", this.connectionHandler);
    this.socket.addEventListener("close", this.connectionHandler);
    this.socket.addEventListener("error", this.errorHandler);
    this.socket.addEventListener("message", this.messageHandler);
    this.callsign = conn.callsign;
    this.session = conn.session;
  }

  public disconnect() {
    if (!this.socket) return;
    clearInterval(this.timer);
    this.timer = -1;
    this.socket.close();
    this.socket = undefined;
    this.client = -1;
  }

  private send(msg: ImcsMsg) {
    if (!this.socket || this.client < 0) return;
    const raw = JSON.stringify(msg)
    this.socket.send(raw);
  }

  public msgSendWhiteboard(canvas: HTMLCanvasElement) {
    const data = canvas.toDataURL('image/png')
    const msg: ImcsMsgWhiteboard = {id: ImcsMsgId.Whiteboard, client: this.client, dataUrl: data}
    this.send(msg)
  }

  public msgSendPointer(pos?: Point) {
    const msg: ImcsMsgPos = {id: ImcsMsgId.Pointer, client: this.client, pos: pos}
    this.send(msg)
  }

  public msgSendBullseyePos(pos: Point) {
    const msg: ImcsMsgPos = {id: ImcsMsgId.Bullseye, client: this.client, pos: pos}
    this.send(msg)
  }

  public msgSendSymbol(symbols: MilSymbol[]) {
    const msg: ImcsMsgSymbol = {id: ImcsMsgId.Symbol, client: this.client, symbols: symbols}
    this.send(msg)
  }

  public msgSendDraw(parts: WbDraw[]) {
    const msg: ImcsMsgDraw = {id: ImcsMsgId.Draw, client: this.client, parts: parts}
    this.send(msg)
  }

  private connectionHandler = (e: Event) => {
    if (this.socket?.readyState == WebSocket.OPEN) {
      this.imcsDebug("connected to IMCS");
      this.imcsMsgAuthSend();
      this.global.connected = true;
    } else {
      this.imcsDebug("disconnected from IMCS");
      this.global.connected = false;
      // cleanup that should happen after close is observed
      if (this.socket) {
        this.socket.removeEventListener("open", this.connectionHandler);
        this.socket.removeEventListener("close", this.connectionHandler);
        this.socket.removeEventListener("error", this.errorHandler);
        this.socket.removeEventListener("message", this.messageHandler);
        this.socket = undefined;
      }
      this.client = -1;
    }
  }

  private imcsMsgAuthSend() {
    if (!this.socket) return
    const msg: ImcsMsgAuthRequest = {id: ImcsMsgId.Auth, client: -1, session: this.session, callsign: this.callsign}
    this.socket.send(JSON.stringify(msg))
  }

  private errorHandler = (e: Event) => {
    console.log("failed to connect to IMCS")
  }

  private messageHandler = (e: MessageEvent) => {
    const msg = JSON.parse(e.data);

    if (e.data instanceof Blob) {
      this.imcsDebug("received whiteboard")
    }
    switch (msg.id) {
      case ImcsMsgId.Auth:
        this.msgReceivedAuth(msg);
        break;
      case ImcsMsgId.Bullseye:
        this.msgReceivedBullseyePos(msg);
        break;
      case ImcsMsgId.Symbol:
        this.msgReceivedSymbol(msg);
        break;
      // case 3:
      //   imcsMsgLineRcvd(msg);
      //   break;
      // case 4:
      //   imcsMsgEllipseRcvd(msg);
      //   break;
      // case 5:
      //   imcsMsgMarkerRcvd(msg);
      //   break;
      // case 6:
      //   imcsMsgTextRcvd(msg);
      //   break;
      // case 7:
      //   imcsMsgEraseRcvd(msg);
      //   break;
      case ImcsMsgId.Whiteboard:
        this.msgReceivedWhiteboard(msg);
        break;
      case ImcsMsgId.Pointer:
        this.msgReceivedPointer(msg);
        break;
      case ImcsMsgId.Draw:
        this.msgReceivedDraw(msg);
        break;
      default:
      // Ignore unknown Messages or Ping
    }
  }

  private imcsDebug(...args: any[]) {
    if (this.IMCS_DEBUG) args.forEach(arg => console.log(arg));
  }

  private msgReceivedAuth(msg: ImcsMsgAuthResult) {
    this.imcsDebug("Message: Auth");
    if (msg.result == -1) {
      console.log("Failed to register callsign with session");
      this.disconnect();
    } else {
      this.client = msg.result;
      this.timer = setInterval(() => {
        const ping: ImcsMsg = {id: ImcsMsgId.Ping, client: this.client}
        this.send(ping)
      }, 30000)
    }
  }

  private msgReceivedDraw(msg: ImcsMsgDraw) {
    this.drawEventHandler.forEach(cb => cb(msg.parts))
  }

  private msgReceivedSymbol(msg: ImcsMsgSymbol) {
    this.symbolEventHandler.forEach(cb => cb(msg.symbols))
  }

  private msgReceivedPointer(msg: ImcsMsgPos) {
    this.pointerEventHandler.forEach(cb => cb(msg.pos))
  }

  private msgReceivedBullseyePos(msg: ImcsMsgPos) {
    this.bullseyePosEventHandler.forEach(cb => cb(msg.pos!))
  }

  private msgReceivedWhiteboard(msg: ImcsMsgWhiteboard) {
    this.imcsDebug("Message: Whiteboard: " + msg.dataUrl.length)
    const img = new Image(this.global.map!.pixels, this.global.map!.pixels)
    img.src = msg.dataUrl;
    img.onload = () => {
      // TODO: migrate to new canvas
      // layer.whitebrd.ctx.clearRect(0, 0, 3840, 3840);
      // layer.whitebrd.ctx.drawImage(img, 0, 0, 3840, 3840);
      // refreshCanvas();
    };
  }


}
