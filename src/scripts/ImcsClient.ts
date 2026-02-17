import {useGlobalStore} from "@/stores/global.ts";
import type {Point} from "@/model/base.ts";
import type {MilSymbol, WbShape} from "@/model/overlays.ts";
import type {CollabSettings} from "@/model/settings.ts";

enum ImcsMsgId {
  Auth = 0,
  Pointer = 1,
  Bullseye = 2,
  Draw = 3,
  Symbol = 4,
  Clear = 5,
  Mission = 6,
  Ping = 7
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
  parts: WbShape[]
}

export interface ImcsMsgMission extends ImcsMsg {
  title: string
  ini: string[]
}

export class ImcsClient {

  private missionEventHandler: ((title: string, ini: string[]) => void)[] = [];

  public onMissionEvent(cb: ((title: string, ini: string[]) => void)) {
    this.missionEventHandler.push(cb);
  }

  private drawEventHandler: ((parts: WbShape[]) => void)[] = [];

  public onDrawEvent(cb: ((parts: WbShape[]) => void)) {
    this.drawEventHandler.push(cb);
  }

  private clearEventHandler: (() => void)[] = [];

  public onClearEvent(cb: (() => void)) {
    this.clearEventHandler.push(cb);
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

  public msgSendPointer(pos?: Point) {
    const msg: ImcsMsgPos = {id: ImcsMsgId.Pointer, client: this.client, pos: pos}
    this.send(msg)
  }

  public msgSendBullseyePos(pos: Point) {
    const msg: ImcsMsgPos = {id: ImcsMsgId.Bullseye, client: this.client, pos: pos}
    this.send(msg)
  }

  public msgSendClear() {
    const msg: ImcsMsg = {id: ImcsMsgId.Clear, client: this.client}
    this.send(msg)
  }

  public msgSendDraw(parts: WbShape[]) {
    const msg: ImcsMsgDraw = {id: ImcsMsgId.Draw, client: this.client, parts: parts}
    this.send(msg)
  }

  public msgSendSymbol(symbols: MilSymbol[]) {
    const msg: ImcsMsgSymbol = {id: ImcsMsgId.Symbol, client: this.client, symbols: symbols}
    this.send(msg)
  }

  public msgSendMission(title: string, ini: string[]) {
    const msg: ImcsMsgMission = {id: ImcsMsgId.Mission, client: this.client, title: title, ini: ini}
    this.send(msg)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private errorHandler = (e: Event) => {
    console.log("failed to connect to IMCS")
  }

  private messageHandler = (e: MessageEvent) => {
    const msg = JSON.parse(e.data)

    if (e.data instanceof Blob) {
      this.imcsDebug("received whiteboard")
    }
    switch (msg.id) {
      case ImcsMsgId.Auth:
        this.msgReceivedAuth(msg);
        break;
      case ImcsMsgId.Pointer:
        this.pointerEventHandler.forEach(cb => cb(msg.pos))
        break;
      case ImcsMsgId.Bullseye:
        this.bullseyePosEventHandler.forEach(cb => cb(msg.pos!))
        break;
      case ImcsMsgId.Clear:
        this.clearEventHandler.forEach(cb => cb())
        break;
      case ImcsMsgId.Draw:
        this.drawEventHandler.forEach(cb => cb(msg.parts))
        break;
      case ImcsMsgId.Symbol:
        this.symbolEventHandler.forEach(cb => cb(msg.symbols))
        break;
      case ImcsMsgId.Mission:
        this.missionEventHandler.forEach(cb => cb(msg.title, msg.ini))
        break;
      default:
      // Ignore unknown Messages or Ping
    }
  }

  private imcsDebug(...args: unknown[]) {
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
}
