import {Mode} from "@/model/mode.ts";
import {reactive} from "vue";

interface Properties {
  zoom: number
  mode: Mode
  mouseDown: boolean
}

export const properties = reactive<Properties>({
  zoom: 1,
  mode: Mode.None,
  mouseDown: false
});
