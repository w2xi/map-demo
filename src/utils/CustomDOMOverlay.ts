function loadDOMOverlay() {
  function BaseDOMOverlay(options) {
    TMap.DOMOverlay.call(this, options);
  }

  BaseDOMOverlay.prototype = new TMap.DOMOverlay();

  // 初始化
  BaseDOMOverlay.prototype.onInit = function(options) {
    this.position = options.position;
  };
  
  // 销毁时需解绑事件监听
  BaseDOMOverlay.prototype.onDestroy = function() {
    if (this.onClick) {
      this.dom.removeEventListener('click', this.onClick);
    }
  };
  
  // 创建DOM元素，返回一个DOMElement，使用this.dom可以获取到这个元素
  BaseDOMOverlay.prototype.createDOM = function() {};

  // 更新DOM元素，在地图移动/缩放后执行
  BaseDOMOverlay.prototype.updateDOM = function() {
    if (!this.map) {
      return;
    }
    // 经纬度坐标转容器像素坐标
    let pixel = this.map.projectToContainer(this.position);
    // 使中心点对齐经纬度坐标点
    let left = pixel.getX() - this.dom.clientWidth / 2 + 'px';
    let top = pixel.getY() - this.dom.clientHeight / 2 + 'px';
    this.dom.style.transform = `translate(${left}, ${top})`;
  };

  function WinInfoMarkerOverlay(options) {
    BaseDOMOverlay.call(this, options);
  }
  
  WinInfoMarkerOverlay.prototype = new BaseDOMOverlay();
  
  // 初始化
  WinInfoMarkerOverlay.prototype.onInit = function(options) {
    this.position = options.position;
    this.type = options.data.type;
    this.content = options.data.content;
    this.style = options.data.style || {};
  };
  
  // 创建DOM元素，返回一个DOMElement，使用this.dom可以获取到这个元素
  WinInfoMarkerOverlay.prototype.createDOM = function() {
    const width = this.getWinDOMWidth()
    const box = document.createElement('div')
    box.innerHTML = this.content

    box.style.position = 'absolute'
    box.style.top = '-30px'
    box.style.left = '0'
    box.style.width = width
    box.style.display = 'flex'
    box.style.alignItems = 'center'
    box.style.justifyContent = 'center'
    box.style.fontSize = '12px'
    box.style.fontWeight = 700
    box.style.lineHeight = '20px'
    box.style.padding = '6px 4px'
    box.style.color = '#fff'
    box.style.backgroundColor = '#387fc9'
    box.style.opacity = 0.9
    box.style.borderRadius = '3px'
    box.style.visibility = 'hidden'
    box.style.zIndex = 10

    // overwrite default style
    Object.entries(this.style).forEach(([key, val]) => {
      box.style[key] = val
    })

    const child = document.createElement('div')
    child.style.position = 'absolute'
    child.style.bottom = '-14px'
    child.style.left = '50%'
    child.style.transform = 'translateX(-50%)'
    child.style.height = 0
    child.style.width = 0
    child.style.border = '7px solid'
    child.style.borderColor = '#409EFF transparent transparent transparent'

    box.appendChild(child)

    // click事件监听
    this.onClick = () => {
      // DOMOverlay继承自EventEmitter，可以使用emit触发事件
      this.emit('click');
    };
    // pc端注册click事件，移动端注册touchend事件
    box.addEventListener('click', this.onClick);
    return box;
  };
  
  WinInfoMarkerOverlay.prototype.getWinDOMWidth = function() {
    let width = '';
    switch (this.type) {
      case 'car':
        width = this.content.length * 8 + 'px';
        break;
      case 'station':
        width = this.content.length * 15 + 'px';
        break;
      default:
        width = this.content.length * 12 + 'px';
    }
    return width;
  }

  WinInfoMarkerOverlay.prototype.setVisible = function (visible) {
    this.dom.style.visibility = (visible || visible == undefined) ? 'visible' : 'hidden'
  }

  function CircleMarkerOverlay(options) {
    BaseDOMOverlay.call(this, options);
  }
  
  CircleMarkerOverlay.prototype = new BaseDOMOverlay();
  
  // 销毁时需解绑事件监听
  CircleMarkerOverlay.prototype.onDestroy = function() {
    if (this.onClick) {
      this.dom.removeEventListener('click', this.onClick);
    }
    if (this.onMouseover) {
      this.dom.removeEventListener('mouseover', this.onMouseover);
    }
    if (this.onMouseout) {
      this.dom.removeEventListener('mouseout', this.onMouseout);
    }
  };
  
  // 创建DOM元素，返回一个DOMElement，使用this.dom可以获取到这个元素
  CircleMarkerOverlay.prototype.createDOM = function() {
    const box = document.createElement('div');
    box.style.position = 'absolute'
    box.style.top = '0'
    box.style.left = '0'
    box.style.width = '9px'
    box.style.height = '9px'
    box.style.borderRadius = '50%'
    box.style.backgroundColor = '#409EFF'
    box.style.border = '2px solid #fff'
    box.style.zIndex = 9
  
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
  };
  
  return {
    WinInfoMarkerOverlay,
    CircleMarkerOverlay,
  }
}

export {
  loadDOMOverlay
}