import carImg from '@/assets/images/normal-vehicle.png'
import activeCarImg from '@/assets/images/activated-vehicle.png'
import { transformFromWGSToGCJ } from './WSCoordinate'
import { loadDOMOverlay } from './CustomDOMOverlay.js'

type Options = {
  el: HTMLElement;
}

class TMapHandler {
  options: Options
  siteId: string
  mapIns: TMap.Map | null
  carMarkerLayer: TMap.MultiMarker | null
  polylineLayer: TMap.MultiPolyline | null
  prevCarGeo: TMap.Geometry | null
  gid: number
  paths: any[]
  carMarkerMap: Record<string, any>
  carInfoMarkerMap: Record<string, any>
  stationMarkerMap: Record<string, any>
  circleMarkerMap: Record<string, any>

  constructor(options: Options) {
    this.options = options || {}
    this.siteId = ''
    this.mapIns = null
    this.carMarkerLayer = null
    this.polylineLayer = null
    this.prevCarGeo = null
    this.gid = 0
    this.paths = []
    this.carMarkerMap = Object.create(null)
    this.carInfoMarkerMap = Object.create(null)
    this.stationMarkerMap = Object.create(null)
    this.circleMarkerMap = Object.create(null)
  }

  load() {
    return new Promise((resolve, reject) => {
      window.__onAPILoader = (err) => {
        delete window.__onAPILoader
        if (err) {
          reject(err)
        } else {
          this.createMap()
          this.hiddenMapIcon()
          this.initMarkerLayer()
          this.initPolylineLayer()
          this.initDOMOverlay()
          resolve(window.TMap)
        }
      }
      const script = document.createElement("script")
      script.src = "https://map.qq.com/api/gljs?v=1.exp&key=K76BZ-YV2C4-CGEUK-D37OK-L7HE3-5SBL7&callback=__onAPILoader"
      document.body.appendChild(script)
    })
  }

  createMap() {
    const center = new TMap.LatLng(28.251538, 113.085209)
    const map = new TMap.Map(this.options.el, {
      center: center,
      zoom: 16,
      viewMode: '2D',
      showControl: false,
      mapStyleId: 'style3'
    })
    this.mapIns = map
    return map
  }

  initDOMOverlay() {
    this.DOMOverlay = loadDOMOverlay()
  }

  initMarkerLayer() {
    this.carMarkerLayer = new TMap.MultiMarker({
      id: 'marker-layer', // 图层唯一标识
      map: this.mapIns!,  //指定地图容器
    })
    this.carMarkerLayer.on('click', (evt: TMap.GeometryOverlayEvent) => {
      const cb = evt.geometry.cb
      if (evt.geometry.id !== this.prevCarGeo.id) {
        this.activeCurrCar(evt.geometry.id)
        cb && cb(evt.geometry.properties)
      }
    })
  }

  initPolylineLayer() {
	  this.polylineLayer = new TMap.MultiPolyline({
      id: 'polyline-layer', // 图层唯一标识
      map: this.mapIns,
      styles: {
        blue: new TMap.PolylineStyle({
          color: '#409EFF', //线填充色
          width: 3, //折线宽度
          borderWidth: 1, //边线宽度
          borderColor: '#409EFF', //边线颜色
          lineCap: 'round', //线端头方式
        }),
        'deeply-blue': new TMap.PolylineStyle({
          color: '#0554F2', //线填充色
          width: 3, //折线宽度
          borderWidth: 1, //边线宽度
          borderColor: '#0554F2', //边线颜色
          lineCap: 'round', //线端头方式
        })
      },
    });
  }

  setCarStyles(data) {
    const styles = {}
    data.forEach(item => {
      styles['default-' + item.vehicleCode] = new TMap.MarkerStyle({
        width: 45,  // 点标记样式宽度（像素）
        height: 24, // 点标记样式高度（像素）
        src: carImg,  //图片路径
        anchor: { x: 22, y: 24 }, // center
        rotate: +item.azimuth + 180,
      })
      styles['active-' + item.vehicleCode] = new TMap.MarkerStyle({
        width: 45,  
        height: 24, 
        src: activeCarImg,
        anchor: { x: 22, y: 24 },
        rotate: +item.azimuth + 180,
      })
    })
    this.carMarkerLayer.setStyles(styles)
  }

  renderCarMarkers(data = [], clickedCb) {
    data = data.filter((item) =>
      item.longitude && item.latitude && 
      item.longitude !== '0.0' && item.latitude !== '0.0'
    )
    if (!data) return console.warn('车辆数据未到达')

    const { WinInfoMarkerOverlay } = this.DOMOverlay

    this.setCarStyles(data)

    data.forEach(item => {
      const geometry = this.carMarkerMap[item.vehicleCode]
      if (geometry) { // update
        const position = this.getLngLat(item)
        const diffLat = position.lat - geometry.position.lat
        const diffLng = position.lng - geometry.position.lng
        geometry.position = position
        geometry.properties = item
        if (geometry.rank !== Infinity) {
          geometry.rank = ++this.gid
        }
        this.carMarkerLayer.updateGeometries([geometry])
        // if (diffLat !== 0 || diffLng !== 0) {
        //   console.log(1)
        //   this.carMarkerLayer.moveAlong({
        //     [item.vehicleCode]: {
        //       path: [geometry.position, position],
        //       speed: 10,
        //     },
        //   })
        // }

        const carInfoMarker = this.carInfoMarkerMap[item.vehicleCode]
        carInfoMarker.position = this.getLngLat(item)
        carInfoMarker.updateDOM()
      } else { // add
        const carGeometry = {
          id: item.vehicleCode,
          styleId: 'default-' + item.vehicleCode,
          position: this.getLngLat(item),
          properties: item,
          rank: ++this.gid, // 标注点的图层内绘制顺序
          cb: clickedCb,
        }
        this.carMarkerMap[item.vehicleCode] = carGeometry
        this.carMarkerLayer.add([carGeometry])

        const carInfoMarker = new WinInfoMarkerOverlay({
          id: item.vehicleCode,
          map: this.mapIns,
          data: { content: item.vehicleName, type: 'car' },
          position: this.getLngLat(item),
        })
        this.carInfoMarkerMap[item.vehicleCode] = carInfoMarker
      }
    })
  }

  renderPath(data, siteId) {
    if (data.length) {
      this.siteId = siteId
      const paths = data.map(item => this.getLngLat(item))
      const geometries = this.polylineLayer.getGeometries()
      const blueGeometry = [
        {
          id: siteId, // 折线唯一标识，删除时使用
          styleId: 'blue',// 绑定样式名
          paths: paths,
        }
      ]
      const deeplyBlueGeometry = [{
        id: siteId,
        styleId: 'deeply-blue',
        paths: paths,
      }]
      if (geometries.length) { // update
        this.polylineLayer.updateGeometries(deeplyBlueGeometry)
        setTimeout(() => {
          this.polylineLayer.updateGeometries(blueGeometry)
        }, 100)
      } else { // add
        this.polylineLayer.add(blueGeometry)
      }
      this.paths = paths
    }
  }

  renderStationMarkers(data) {
    const { WinInfoMarkerOverlay, CircleMarkerOverlay } = this.DOMOverlay
    data.forEach(item => {
      if (!this.stationMarkerMap[item.stationId]) {
        const stationMarker = new WinInfoMarkerOverlay({
          map: this.mapIns,
          data: { content: item.stationName, type: 'station' },
          position: this.getLngLat(item),
        })
        const circleMarker = new CircleMarkerOverlay({
          map: this.mapIns,
          position: this.getLngLat(item),
        })
        circleMarker.on('mouseover', () => {
          stationMarker.setVisible(true)
        })
        circleMarker.on('mouseout', () => {
          stationMarker.setVisible(false)
        })
        this.stationMarkerMap[item.stationId] = stationMarker
        this.circleMarkerMap[item.stationId] = circleMarker
      }
    })
  }

  activeCurrCar(vehicleCode) {
    const currGeometry = this.carMarkerMap[vehicleCode]
    const currCarInfoMarker = this.carInfoMarkerMap[vehicleCode]
    
    if (this.prevCarGeo) {
      const prevVehicleCode = this.prevCarGeo.id
      const prevGeometry = this.carMarkerMap[prevVehicleCode]
      const prevCarInfoMarker = this.carInfoMarkerMap[prevVehicleCode]
      prevCarInfoMarker.setVisible(false)
      prevGeometry.styleId = 'default-' + prevVehicleCode
      prevGeometry.rank = ++this.gid
    }
    if (currGeometry) {
      currGeometry.styleId = 'active-' + vehicleCode
      currGeometry.rank = Infinity
      currCarInfoMarker.setVisible(true)
      this.carMarkerLayer.updateGeometries([currGeometry])
      this.prevCarGeo = currGeometry
    }
  }

  toggleStations(visible) {
    for (let key in this.stationMarkerMap) {
      this.stationMarkerMap[key].setVisible(visible)
    }
  }

  getCarMarker(vehicleCode) {
    return this.carMarkerMap[vehicleCode]
  }

  destroy() {
    for (let key in this.carInfoMarkerMap) {
      this.carInfoMarkerMap[key].destroy()
    }
    for (let key in this.stationMarkerMap) {
      this.stationMarkerMap[key].destroy()
    }
    for (let key in this.circleMarkerMap) {
      this.circleMarkerMap[key].destroy()
    }
    const ids = Object.keys(this.carMarkerMap)
    this.carMarkerLayer.remove(ids)
    this.polylineLayer.remove(this.siteId)

    this.carMarkerMap = Object.create(null)
    this.carInfoMarkerMap = Object.create(null)
    this.stationMarkerMap = Object.create(null)
    this.circleMarkerMap = Object.create(null)
  }

  /**
   * 经纬度转换
   * @param {object} location { longitude: number | string, latitude: number | string }
   * @return TMap.LatLng
   */
  getLngLat(location) {
    const { longitude, latitude } = location
    if (!longitude || !latitude) {
      console.warn('[Position Warn]: 经度或纬度缺失', position)
      return
    }
    location = transformFromWGSToGCJ(+longitude, +latitude)
    return new TMap.LatLng(location.latitude, location.longitude)
  }

  // 设置自适应显示marker
  setFitView() {
    if (this.prevCarGeo) {
      const geometries = [this.prevCarGeo]
      //初始化
      const bounds = new TMap.LatLngBounds();
      //判断标注点是否在范围内
      geometries.forEach(function(item){
        //若坐标点不在范围内，扩大bounds范围
        if(bounds.isEmpty() || !bounds.contains(item.position)){
          bounds.extend(item.position);
        }
      })
      //设置地图可视范围
      this.mapIns.fitBounds(bounds, {
        padding: 100 // 自适应边距
      });
    }
  }

  hiddenMapIcon() {
    // 隐藏除信息窗体以外不必要的内容
    const a = document.querySelector('canvas+div:last-child');
    const div = a.children[a.childElementCount - 1];
    div.style.display = 'none';

    const canvas = document.querySelector('canvas');
    canvas.style.position = 'absolute'
  }
}

export default TMapHandler