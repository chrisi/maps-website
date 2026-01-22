import {useGlobalStore} from "@/stores/global.ts";
import type {Point} from "@/model/base.ts";
import type {LineSegment} from "@/model/overlays.ts";
import type {CollabSettings} from "@/model/settings.ts";

interface ImcsMsg {
  id: number;
  client: number;
}

export interface ImcsMsgAuthRequest extends ImcsMsg {
  callsign: string
  session: string
}

export interface ImcsMsgAuthResult extends ImcsMsg {
  result: number
}

export interface ImcsMsgSymbol extends ImcsMsg {
  pos: Point
  sym: string
}

export interface ImcsMsgPointer extends ImcsMsg {
  pos: Point
}

export interface ImcsMsgDraw extends ImcsMsg {
  segments: LineSegment[]
}

export interface ImcsMsgWhiteboard extends ImcsMsg {
  dataUrl: string
}

export class ImcsClient {

  private drawEventHandler: ((segments: LineSegment[]) => void)[] = [];

  public onDrawEvent(cb: ((segments: LineSegment[]) => void)) {
    this.drawEventHandler.push(cb);
  }

  private pointerEventHandler: ((pt: Point) => void)[] = [];

  public onPointerEvent(cb: ((pt: Point) => void)) {
    this.pointerEventHandler.push(cb);
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
    this.socket.send(JSON.stringify(msg));
  }

  public msgSendWhiteboard(canvas: HTMLCanvasElement) {
    const data = canvas.toDataURL('image/png')
    const msg: ImcsMsgWhiteboard = {id: 8, client: this.client, dataUrl: data}
    this.send(msg)
  }

  public msgSendDraw(segments: LineSegment[]) {
    const msg: ImcsMsgDraw = {id: 11, client: this.client, segments: segments}
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
    if (!this.socket) return;
    const msg: ImcsMsgAuthRequest = {id: 0, client: -1, session: this.session, callsign: this.callsign}
    this.socket.send(JSON.stringify(msg))
  }

  private errorHandler = (e: Event) => {
    console.log("failed to connect to IMCS: " + e);
  }

  private messageHandler = (e: MessageEvent) => {
    const msg = JSON.parse(e.data);

    if (e.data instanceof Blob) {
      this.imcsDebug("received whiteboard");
    }

    switch (msg.id) {
      case 0:
        this.msgReceivedAuth(msg);
        break;
      // case 1:
      //   imcsMsgBullseyeRcvd(msg);
      //   break;
      // case 2:
      //   imcsMsgSymbolRcvd(msg);
      //   break;
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
      case 8:
        this.msgReceivedWhiteboard(msg);
        break;
      case 9:
        this.msgReceivedPointer(msg);
        break;
      case 11:
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
        const ping: ImcsMsg = {id: 10, client: this.client}
        this.send(ping)
      }, 30000)
    }
  }

  private msgReceivedDraw(msg: ImcsMsgDraw) {
    this.drawEventHandler.forEach(cb => cb(msg.segments))
  }

  private msgReceivedPointer(msg: ImcsMsgPointer) {
    this.pointerEventHandler.forEach(cb => cb(msg.pos))
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
