import { 
  DOMOverlayOptions, 
  WinInfoDOMOverlayOptions, 
  WinInfoMarkerType,
} from './type'

function loadDOMOverlay() {
  class WinInfoMarkerOverlay extends TMap.DOMOverlay {
    dom: HTMLElement | null
    onClick: (ev: MouseEvent) => void
    options: WinInfoDOMOverlayOptions
    constructor(options: WinInfoDOMOverlayOptions) {
      super(options)
      this.options = options
      this.dom = null
      this.onClick = () => {}
    }
  
    onInit(options: DOMOverlayOptions) {}
  
    createDOM() {
      const { content, style } = this.options.data
      const width = this.getWinDOMWidth()
      const box = document.createElement('div')
      box.innerHTML = content
  
      box.style.position = 'absolute'
      box.style.top = '-30px'
      box.style.left = '0'
      box.style.width = width
      box.style.display = 'flex'
      box.style.alignItems = 'center'
      box.style.justifyContent = 'center'
      box.style.fontSize = '12px'
      box.style.fontWeight = '700'
      box.style.lineHeight = '20px'
      box.style.padding = '6px 4px'
      box.style.color = '#fff'
      box.style.backgroundColor = '#387fc9'
      box.style.opacity = '0.9'
      box.style.borderRadius = '3px'
      box.style.visibility = 'hidden'
      box.style.zIndex = '10'
  
      // overwrite default style
      Object.entries(style).forEach(([key, val]) => {
        box.style[key as any] = val
      })
  
      const child = document.createElement('div')
      child.style.position = 'absolute'
      child.style.bottom = '-14px'
      child.style.left = '50%'
      child.style.transform = 'translateX(-50%)'
      child.style.height = '0'
      child.style.width = '0'
      child.style.border = '7px solid'
      child.style.borderColor = '#409EFF transparent transparent transparent'
  
      box.appendChild(child)
  
      // click事件监听
      this.onClick = (ev: any) => {
        // DOMOverlay继承自EventEmitter，可以使用emit触发事件
        this.emit('click');
      };
      // pc端注册click事件，移动端注册touchend事件
      box.addEventListener('click', this.onClick);
      return box;
    }
  
    // 更新DOM元素，在地图移动/缩放后执行
    updateDOM() {
      if (!this.options.map) {
        return;
      }
      // 经纬度坐标转容器像素坐标
      let pixel = this.options.map.projectToContainer(this.options.position);
      // 使中心点对齐经纬度坐标点
      let left = pixel.getX() - this.dom!.clientWidth / 2 + 'px';
      let top = pixel.getY() - this.dom!.clientHeight / 2 + 'px';
      this.dom!.style.transform = `translate(${left}, ${top})`;
    }

    onDestroy() {
      if (this.onClick) {
        this.dom!.removeEventListener('click', this.onClick);
      }
    }
  
    getWinDOMWidth() {
      const { type, content } = this.options.data
      let width = content.length * 12 + 'px';;
      switch (type) {
        case WinInfoMarkerType.CAR:
          width = content.length * 8 + 'px';
          break;
        case WinInfoMarkerType.STATION:
          width = content.length * 15 + 'px';
          break;
        default:
          const unReachable: never = type;
      }
      return width;
    }
  
    setDOMVisible(visible: boolean) {
      this.dom!.style.visibility = (visible || visible == undefined) ? 'visible' : 'hidden'
    }
  }
  
  class CircleMarkerOverlay extends TMap.DOMOverlay {
    dom: HTMLElement | null
    onClick: (ev: MouseEvent) => void
    onMouseover: (ev: MouseEvent) => void
    onMouseout: (ev: MouseEvent) => void
    options: DOMOverlayOptions
    constructor(options: DOMOverlayOptions) {
      super(options)
      super(options)
      this.options = options
      this.dom = null
      this.onClick = () => {}
      this.onMouseover = () => {}
      this.onMouseout = () => {}
    }
  
    createDOM(): HTMLDivElement {
      const box = document.createElement('div');
      box.style.position = 'absolute'
      box.style.top = '0'
      box.style.left = '0'
      box.style.width = '9px'
      box.style.height = '9px'
      box.style.borderRadius = '50%'
      box.style.backgroundColor = '#409EFF'
      box.style.border = '2px solid #fff'
      box.style.zIndex = '9'
    
      this.onMouseover = () => {
        this.emit('mouseover');
      };
      this.onMouseout = () => {
        this.emit('mouseout');
      };
      // pc端注册click事件，移动端注册touchend事件
      box.addEventListener('click', this.onClick);
      box.addEventListener('mouseover', this.onMouseover);
      box.addEventListener('mouseout', this.onMouseout);
  
      return box;
    }
  
    // 更新DOM元素，在地图移动/缩放后执行
    updateDOM() {
      if (!this.options.map) {
        return;
      }
      // 经纬度坐标转容器像素坐标
      let pixel = this.options.map.projectToContainer(this.options.position);
      // 使中心点对齐经纬度坐标点
      let left = pixel.getX() - this.dom!.clientWidth / 2 + 'px';
      let top = pixel.getY() - this.dom!.clientHeight / 2 + 'px';
      this.dom!.style.transform = `translate(${left}, ${top})`;
    }
  
    onDestroy() {
      if (this.onClick) {
        this.dom!.removeEventListener('click', this.onClick);
      }
      if (this.onMouseover) {
        this.dom!.removeEventListener('mouseover', this.onMouseover);
      }
      if (this.onMouseout) {
        this.dom!.removeEventListener('mouseout', this.onMouseout);
      }
    }
  }

  return {
    WinInfoMarkerOverlay,
    CircleMarkerOverlay,
  }
}

export {
  loadDOMOverlay
}