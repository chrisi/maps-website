import {reactive} from "vue";

interface Properties {
  zoom: number
  zoomSpeed: number
  mouseDown: boolean
}

export const properties = reactive<Properties>({
  zoom: 1,
  zoomSpeed: 1.1,
  mouseDown: false
});
