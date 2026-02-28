import {ref} from "vue";
import type {AgentSettings} from "@/model/settings.ts";

const socket = ref<WebSocket | null>(null)

export interface AgentMessage {
  type: string,
  version?: string,
  payload?: Ownship | undefined
}

export interface Ownship {
  x: number,
  y: number,
  z: number
}

export class AgentClient {
  private socket: WebSocket | null = null

  private updateEventHandler: (() => void)[] = [];

  public onUpdateEvent(cb: (() => void)) {
    this.updateEventHandler.push(cb);
  }

  private posEventHandler: ((pos: Ownship) => void)[] = [];

  public onPosEvent(cb: ((pos: Ownship) => void)) {
    this.posEventHandler.push(cb);
  }

  private openEventHandler: (() => void)[] = [];

  public onOpenEvent(cb: (() => void)) {
    this.openEventHandler.push(cb);
  }

  private closeEventHandler: (() => void)[] = [];

  public onCloseEvent(cb: (() => void)) {
    this.closeEventHandler.push(cb);
  }

  public connect(conn: AgentSettings) {
    if (this.socket) return;

    this.socket = new WebSocket(`ws://${conn.host}:${conn.port}/ws`)

    this.socket.onopen = () => {
      console.log('WebSocket connected to BMS agent')
      this.openEventHandler.forEach(cb => cb());
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'pos' && message.payload) {
          const ownship: Ownship = message.payload;
          this.posEventHandler.forEach(cb => cb(ownship));
        }

        if (message.type === 'update') {
          this.updateEventHandler.forEach(cb => cb());
        }
      } catch (e) {
        if (event.data === 'update') {
          this.updateEventHandler.forEach(cb => cb());
        }
      }
    }

    this.socket.onclose = () => {
      console.log('WebSocket disconnected from BMS agent')
      socket.value = null
      this.closeEventHandler.forEach(cb => cb());
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

  }

  public disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}
