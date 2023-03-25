export interface LatLngLocation {
  readonly latitude: string;
  readonly longitude: string;
  [key: string]: any;
}

export interface StationType {
  latitude: string;
  longitude: string;
  stationId: string;
  stationName: string;
}

export interface CarType {
  readonly latitude: string;
  readonly longitude: string;
  vehicleCode: string;
  vehicleName: string;
  azimuth: string;
  batteryInfo: string;
  speed: string;
}

export interface DOMOverlayOptions extends TMap.DOMOverlayOptions {
  id: string;
  data: Record<string, any>;
  position: TMap.LatLng;
}

export enum WinInfoMarkerType {
  STATION,
  CAR,
}

export interface WinInfoDOMOverlayOptions extends DOMOverlayOptions {
  data: {
    type: WinInfoMarkerType;
    content: string;
    style: HTMLElement['style'];
  }
}

export interface IWinInfoDOMOverlay extends TMap.DOMOverlay {
  dom: HTMLElement | null;
  options: WinInfoDOMOverlayOptions;
  onClick: (ev: MouseEvent) => void;
  getWinDOMWidth: () => string;
  setDOMVisible: (arg: boolean) => void;
}

export interface ICircleDOMOverlay extends TMap.DOMOverlay {
  dom: HTMLElement | null
  onClick: (ev: MouseEvent) => void
  onMouseover: (ev: MouseEvent) => void
  onMouseout: (ev: MouseEvent) => void
  options: DOMOverlayOptions
}

export interface DOMOverlayType {
  WinInfoMarkerOverlay: IWinInfoDOMOverlay;
  CircleMarkerOverlay: ICircleDOMOverlay;
}