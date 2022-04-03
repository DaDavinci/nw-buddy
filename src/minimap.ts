import Vector2 from './vector2';
import Pin from './pin';
import StorageInterface from './storage';
import { logError, logMessage } from './debug';
import { getCircularReplacer } from './global';
import CacheInterface from './cache';
/*
 * ClassName:       Minimap
 * Description:     A two dimensional Minimap Canvas object
 * Author:          Dave Inchy;
 * Updated:         2022-03-21
 * ------------------------------------------------- *\
 * @param null
 * ------------------------------------------------- */
export default class Minimap {

  public _once: boolean = true;

  private __ = {
    data: {},
    zoom: 1.0,

    canvas: undefined,
    canvasContext: undefined,

    playerName: undefined,
    playerDirection: undefined,
    playerMapCoords: undefined,

    canvasLeft: undefined,
    canvasRight: undefined,
    canvasTop: undefined,
    canvasBottom: undefined,
    canvasWidth: undefined,
    canvasHeight: undefined,

    mapLeft: undefined,
    mapRight: undefined,
    mapTop: undefined,
    mapBottom: undefined,
    mapWidth: undefined,
    mapHeight: undefined,

    mapToCanvasRatio: undefined,
  };

  constructor(player: any, canvas: HTMLCanvasElement) {
    var _ = this.__;

    // Add data for pins to the cache

    //check for the cache file otherwise dont execute cachedata


    _.data = require("./assets/cache.json");
    this.cacheData();

    _.canvas = canvas;
    _.canvasContext = _.canvas.getContext("2d");

    _.playerName = player.user ? player.user : "Player";
    _.playerDirection = player.direction;
    _.playerMapCoords = new Vector2(player.x, player.y);

    _.canvasLeft = 0;
    _.canvasRight = canvas.width * _.zoom;
    _.canvasTop = 0;
    _.canvasBottom = canvas.height * _.zoom;
    _.canvasWidth = _.canvasRight - _.canvasLeft;
    _.canvasHeight = _.canvasBottom - _.canvasTop;

    // map constants // DONT CHANGE THIS SHOULD WORK
    _.mapLeft = 4520; // West Min 5240
    _.mapRight = 14240; // East Max 14240
    _.mapTop = 10120; // North Max 10240 / 10100 / 10200
    _.mapBottom = 100; // South Min 0
    _.mapWidth = _.mapLeft - _.mapRight; // mapLeft - mapRight
    _.mapHeight = _.mapBottom - _.mapTop; // -mapTop - mapBottom
    // DONT DONT DONT DONT DONT DONT CHANGE CHANGE CHANGE CHANGE CHANGE //

    // tuning the numbers
    _.mapToCanvasRatio = new Vector2(
      _.canvasWidth / _.mapWidth,
      _.canvasHeight / _.mapHeight
    );

    return;
  }

  public async renderCanvas(player: any) {

    this.setZoom();

    this.__.playerMapCoords = new Vector2(player.x, player.y);

    var playerCanvasCoords: Vector2 = new Vector2(
      (this.__.playerMapCoords.x - this.__.mapLeft) *
        this.__.mapToCanvasRatio.x,
      (this.__.mapTop - this.__.playerMapCoords.y) *
        this.__.mapToCanvasRatio.y
    );

    // move the canvas's center to the player position with relative position
    this.__.canvas.style.marginLeft = playerCanvasCoords.x + "px";
    this.__.canvas.style.marginTop = playerCanvasCoords.y + "px";

    this.setZoom(this.__.zoom);

    // draw and animation of the player pointer
    this.rotateNeedle(this.getRotationFromDirection(player.direction));

    // render a grid over the background of the canvas
    this.renderLayers(player);

    return this;
  }

  public async setZoom(amount: number = 1.0) {
    this.__.canvasLeft = 0;
    this.__.canvasRight = this.__.canvas.width * this.__.zoom;
    this.__.canvasTop = 0;
    this.__.canvasBottom = this.__.canvas.height * this.__.zoom;
    this.__.canvasWidth = this.__.canvasRight - this.__.canvasLeft;
    this.__.canvasHeight = this.__.canvasBottom - this.__.canvasTop;

    this.__.canvas.style.width = parseInt(this.__.canvasWidth) + "px";
    this.__.canvas.style.height = parseInt(this.__.canvasHeight) + "px";

    return;
  }

  private renderLayers = async (player: any) => {
    this._once
      ? this.renderGrid(player) &&
        this.renderPins(player) &&
        (this._once = false)
      : (this._once = false);

    return;
  };

  public async refreshRender() {
    this.__.canvasContext.clearRect(
      0,
      0,
      this.__.canvas.width,
      this.__.canvas.height
    );
    this._once = true;

    return;
  }

  private rotateNeedle(angle: number) {
    var needle: HTMLElement = document.getElementById("compassNeedle");
    needle.style.transform = "rotate(" + angle + "deg)";
    return;
  }

  private getRotationFromDirection(playerDirection: string) {
    switch (playerDirection) {
      case "N":
        return 360;
      case "NE":
        return 45;
      case "E":
        return 90;
      case "SE":
        return 135;
      case "S":
        return 180;
      case "SW":
        return 225;
      case "W":
        return 270;
      case "NW":
        return 315;
      default:
        return 360;
    }
  }

  async cacheData() {
    const _ = this.__;
    const data: any = _.data;

    StorageInterface.clear();
    for (let key in data) {
      if (key === typeof "object") {
        logMessage(key, `Object: ${JSON.stringify(data[key])}`);
      }
      if (data.hasOwnProperty(key)) {
        if (!key.toLowerCase().includes("areas") &&
          !key.toLowerCase().includes("documents") &&
          !key.toLowerCase().includes("events") &&
          !key.toLowerCase().includes("fishing") &&
          !key.toLowerCase().includes("monsters") &&
          !key.toLowerCase().includes("npc") &&
          !key.toLowerCase().includes("pois")) {

          for (let key2 in data[key]) {
            if (data[key][key2] === typeof "object") {
              logMessage(key, `${key2} Object: ${JSON.stringify(data[key][key2])}`);
            }
            if (data[key].hasOwnProperty(key2)) {

              for (let key3 in data[key][key2]) {
                if (data[key][key2].hasOwnProperty(key3)) {

                  if (key.toLowerCase() === "chests" && data[key][key2][key3].y !== undefined && data[key][key2][key3].x !== undefined) {

                    let getTier = (str) => {
                      let split = key2.split(/([0-9]+)/);
                      return parseInt(split[1]);;
                    };

                    let title = key3;
                    let type = key2.toLowerCase();

                    let pin = new Pin(
                      key.toLowerCase(),
                      getTier(type),
                      undefined,
                      data[key][key2][key3].x,
                      data[key][key2][key3].y,
                      1
                    )

                    CacheInterface.set(title, JSON.stringify(pin));
                    //logMessage(key, `${title} added to cache => ${JSON.stringify(pin)}`);
                  }

                  if (key.toLowerCase() === "ores" && data[key][key2][key3].y !== undefined && data[key][key2][key3].x !== undefined) {

                    let getTier = (str): number => {
                      switch (str) {
                        case "silver":
                          return 2;
                        case "gold":
                          return 3;
                        case "platinium":
                          return 4;
                        case "iron":
                          return 1;
                        case "starmetal":
                          return 4;
                        case "orichalcum":
                          return 5;
                        case "crystal":
                          return 3;
                        case "lodestone":
                          return 1;
                        case "saltpeter":
                          return 1;
                        case "seeping_stone":
                          return 1;
                        default:
                          return 1;
                      }
                    }

                    let id = key3;
                    let type = key2.toLowerCase();

                    let pin = new Pin(
                      type,
                      getTier(type),
                      undefined,
                      data[key][key2][key3].x,
                      data[key][key2][key3].y,
                      1
                    )

                    CacheInterface.set(id, JSON.stringify(pin));
                  }

                  if (key.toLowerCase() === "plants" && data[key][key2][key3].y !== undefined && data[key][key2][key3].x !== undefined) {

                    let getProps = (str): [string, number] => {
                      let type = "plant";
                      let tier = 1;
                      switch (str) {
                        case "herb":
                          type = "herb";
                          tier = 1;
                          break;
                        case "nut":
                          type = "nut";
                          tier = 1;
                          break;
                        case "honey":
                          type = "honey";
                          tier = 1;
                          break;
                        case "azoth_water":
                          type = "azoth";
                          tier = 5;
                          break;
                        case "barley":
                          type = "barley";
                          tier = 1;
                          break;
                        case "hemp":
                          type = "fiber";
                          tier = 1;
                          break;
                        case "hemp_t4":
                          type = "fiber";
                          tier = 4;
                          break;
                        case "hemp_t5":
                          type = "fiber";
                          tier = 5;
                          break;
                        case "berry":
                          type = "berry";
                          tier = 1;
                          break;
                        case "strawberries":
                          type = "strawberries";
                          tier = 1;
                          break;
                        case "blueberry":
                          type = "blueberry";
                          tier = 1;
                          break;
                        case "cranberry":
                          type = "cranberry";
                          tier = 1;
                          break;
                        case "Single_Pumpkin":
                          type = "pumpkin";
                          tier = 1;
                          break;
                        case "potato":
                          type = "potato";
                          tier = 1;
                          break;
                        case "squash":
                          type = "squash";
                          tier = 1;
                          break;
                        case "broccoli":
                          type = "broccoli";
                          tier = 1;
                          break;
                        case "cabbage":
                          type = "cabbage";
                          tier = 1;
                          break;
                        case "carrot":
                          type = "carrot";
                          tier = 1;
                          break;
                        case "corn":
                          type = "corn";
                          tier = 1;
                          break;
                      }
                      return [type, tier];
                    }

                    let id = key3;
                    let props = (key2.includes("_") && !key2.includes("azoth") && !key2.includes("hemp")) ? ["plant", 1] : getProps(key2);
                    let type: string = props[0].toString();
                    let tier: number = parseInt(props[1].toString());

                    let pin = new Pin(
                      type,
                      tier,
                      undefined,
                      data[key][key2][key3].x,
                      data[key][key2][key3].y,
                      1
                    );

                    CacheInterface.set(id, JSON.stringify(pin));
                  }

                  if (key.toLowerCase() === "woods" && data[key][key2][key3].y !== undefined && data[key][key2][key3].x !== undefined) {
                    let id = key3;
                    let type = key2.toLowerCase();
                    let tier = type === "wyrdwood" ? 4 : type === "ironwood" ? 5 : 1;

                    let pin = new Pin(
                      type,
                      tier,
                      undefined,
                      data[key][key2][key3].x,
                      data[key][key2][key3].y,
                      1
                    );

                    CacheInterface.set(id, JSON.stringify(pin));
                  }

                } // end key4 loop
              } // end key3 loop
            }
          } // end key2 loop
        } // filter end
      }
    } // end key loop
  }

  async renderPins(player: any) {

    var pins: [string, any][] = StorageInterface.getAll();
    pins = pins.concat(CacheInterface.getAll());
    pins.forEach(([key, value]) => {


      let title: string = key;
      let pin: Pin = JSON.parse(value, getCircularReplacer());

      if (pin.icon === undefined || pin.icon === null) {
        return;
      }

      let icon = document.createElement("p");
      icon.style.position = "relative";
      icon.style.transform = "translate(-50%, -50%)";
      icon.style.fontSize = pin.size.width + "px";
      icon.style.lineHeight = pin.size.height + "px";
      icon.innerHTML = pin.icon;

      let img: SVGElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image"
      );
      img.id = pin.owner + "_" + title + "_token_" + pin.token;
      img.classList.add("pin");
      img.appendChild(icon);

      img.style.width = pin.size.width + "px";
      img.style.height = pin.size.height + "px";

      var pinX = -((pin.x - this.__.mapLeft) * this.__.mapToCanvasRatio.x);
      var pinY = -((this.__.mapTop - this.__.mapBottom - (pin.y - this.__.mapBottom)) * this.__.mapToCanvasRatio.y);

      img.onload = () =>
        this.__.canvasContext.drawImage(
          img,
          pinX - (pin.size.width / 2),
          pinY + (pin.size.height / 2),
        );

      // draw a little circle dot on the location
      this.__.canvasContext.fillStyle = "yellow";
      this.__.canvasContext.fillRect(pinX - 1, pinY - 1, 3, 3);

      //draw text on top of the pin with the tag as title
      this.__.canvasContext.font = pin.size.width + "px monospace";
      this.__.canvasContext.textAlign = "center";
      this.__.canvasContext.fillStyle = "#fff";
      this.__.canvasContext.fillText(pin.icon, pinX, pinY - (pin.size.height / 4));

    });

    return true;
  }

  async renderGrid(player: any) {
    const chunksPerAxis = 100;

    function step(length) {
      return Math.floor(length / chunksPerAxis);
    }

    this.__.canvasContext.font = "24px 'New World'";
    this.__.canvasContext.fillStyle = "#fff";
    this.__.canvasContext.lineWidth = 1;

    for (
      let x = this.__.canvasLeft;
      x < this.__.canvasRight;
      x += step(this.__.canvasWidth)
    ) {
      x % (step(this.__.canvasWidth) * 2)
        ? (this.__.canvasContext.strokeStyle = "#fff")
        : (this.__.canvasContext.strokeStyle = "#eee");

      this.__.canvasContext.beginPath();
      this.__.canvasContext.moveTo(x, 0);
      this.__.canvasContext.lineTo(x, this.__.canvasHeight);
      this.__.canvasContext.stroke();

      this.__.canvasContext.fillText(x.toString(), x, 15);
    }

    for (
      let y = this.__.canvasTop;
      y < this.__.canvasBottom;
      y += step(this.__.canvasWidth)
    ) {
      y % (step(this.__.canvasWidth) * 2)
        ? (this.__.canvasContext.strokeStyle = "#fff")
        : (this.__.canvasContext.strokeStyle = "#eee");

      this.__.canvasContext.beginPath();
      this.__.canvasContext.moveTo(0, y);
      this.__.canvasContext.lineTo(this.__.canvasWidth, y);
      this.__.canvasContext.stroke();

      this.__.canvasContext.fillText(y.toString(), 0, y);
    }

    this.__.canvasContext.restore();

    return true;
  }

}