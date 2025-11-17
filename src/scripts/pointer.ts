import {Mode} from "@/model/mode.ts";
import {properties} from "@/scripts/properties.ts";
import {useStateStore} from "@/stores/state.ts";

type PointerPane = {
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject
  ) => void;
};

export function activatePointerEvent(target?: HTMLElement) {
  const pane: PointerPane = (target ?? window) as PointerPane;
  pane.addEventListener('mousedown', pointer_start as EventListener);
  pane.addEventListener('mousemove', pointer_drag as EventListener);
  pane.addEventListener('mouseup', pointer_end as EventListener);
  pane.addEventListener('wheel', mouse_zoom as EventListener, {passive: false});
}

export function deactivatePointerEvent(target?: HTMLElement) {
  const pane: PointerPane = (target ?? window) as PointerPane;
  pane.removeEventListener('mousedown', pointer_start as EventListener);
  pane.removeEventListener('mousemove', pointer_drag as EventListener);
  pane.removeEventListener('mouseup', pointer_end as EventListener);
  pane.removeEventListener('wheel', mouse_zoom as EventListener);
}

let pointerPanStart = {x: 0, y: 0};

//filter out events from certain elements (TODO: optimize event handling)
function peventDefaultFiltered(e: Event) {
  const elem = e.target as HTMLElement;
  if (elem.classList.contains("suspend-prevent")) return;
  e.preventDefault()
}

function pointer_start(e: MouseEvent) {
  peventDefaultFiltered(e)
  switch (properties.mode) {
    case Mode.Move:
      if (properties.mouseDown) break;
      const ofs = document.scrollingElement!;
      pointerPanStart = {x: e.clientX + ofs.scrollLeft, y: e.clientY + ofs.scrollTop};
      properties.mouseDown = true;
      break;
  }
}

function pointer_drag(e: MouseEvent) {
  e.preventDefault()
  switch (properties.mode) {
    case Mode.Move:
      if (!properties.mouseDown) break;
      const dx = pointerPanStart.x - e.clientX;
      const dy = pointerPanStart.y - e.clientY;
      window.scrollTo(dx, dy);
      break;
  }
}

function pointer_end(e: MouseEvent) {
  e.preventDefault()
  switch (properties.mode) {
    case Mode.Move:
      if (!properties.mouseDown) break;
      pointerPanStart = {x: 0, y: 0};
      properties.mouseDown = false;
      break;
  }
}

const limits = {
  zoom_max: 2.5,
  zoom_min: 0.5,
  wheel_rate_hz: 20
}

let wheel_enabled = true;

// Allow zooming with the mouse but limit it to a set wheel rate
// See Limiters (20 hz) and set discrete steps
const mouse_zoom = function (e: WheelEvent) {
  e.preventDefault();

  // Normalize deltaY to a consistent step (e.g., 0.1 zoom per scroll)
  const zoomStep = Math.sign(e.deltaY) * 0.1; // Adjust step size as needed
  const newZoom = properties.zoom - zoomStep;

  // Ensure zoom stays within limits and apply rounding to avoid floating-point drift
  if (wheel_enabled && newZoom >= limits.zoom_min && newZoom <= limits.zoom_max) {
    properties.zoom = Math.round(newZoom * 100) / 100; // Round to 2 decimal places
    scaleView(undefined);
    // saveSettings();
    // refreshCanvas();
    wheel_enabled = false;
    setTimeout(function () {
      wheel_enabled = true;
    }, (1 / limits.wheel_rate_hz) * 1000);
  }
};

let last_zoom = 1

export function scaleView(event: MouseEvent | undefined) { // Add event parameter to capture mouse position

  const state = useStateStore()

  const dimension = 3840 * properties.zoom;
  const dim_str = dimension.toString() + "px";
  const scale = properties.zoom / last_zoom;

  const scroll_element = document.scrollingElement!;
  const client_width = scroll_element.clientWidth;
  const client_height = scroll_element.clientHeight;

  // Get mouse position relative to the viewport
  const mouseX = event ? event.clientX : client_width / 2; // Fallback to center if no event
  const mouseY = event ? event.clientY : client_height / 2;

  // Calculate mouse position relative to the document before scaling
  const doc_mouseX = scroll_element.scrollLeft + mouseX;
  const doc_mouseY = scroll_element.scrollTop + mouseY;

  state.airbasesRef!.style.width = dim_str;
  state.airbasesRef!.style.height = dim_str;

  state.mapRef!.style.width = dim_str;
  state.mapRef!.style.height = dim_str;

  state.annotationRef!.width = dimension;
  state.annotationRef!.height = dimension;

  // Scale bullseye coordinates
// bullseye.x *= scale;
// bullseye.y *= scale;

  // Calculate new scroll position to keep mouse point fixed
  const new_doc_mouseX = doc_mouseX * scale;
  const new_doc_mouseY = doc_mouseY * scale;
  scroll_element.scrollLeft = new_doc_mouseX - mouseX;
  scroll_element.scrollTop = new_doc_mouseY - mouseY;

  last_zoom = properties.zoom;
}
