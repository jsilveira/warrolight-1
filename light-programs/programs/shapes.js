const LayerBasedFunction = require("./../base-programs/LayerBasedFunction");
const {
  XYHue,
  Line,
  Circle,
  InfiniteCircles,
  RandomPixels,
} = require('./../utils/drawables');

module.exports = class Func extends LayerBasedFunction {
  getDrawables() {
    return {
      backgroundXYHue: new XYHue({
        xFactor: 0.01,
        yFactor: 0.01,
        value: .7,
      }),
      bassLine: new Line({
        center: [this.xBounds.center, this.yBounds.center],
      }),
      rotor: new Line({
        center: [this.xBounds.center, this.yBounds.max],
        width: 1,
      }),
      bassCircle: new Circle({
        center: [this.xBounds.center, this.yBounds.max],
        width: 5,
      }),
      rainDots: new InfiniteCircles({
        center: [this.xBounds.center, this.yBounds.min],
        width: .5,
        period: 20,
        radiusWarp: radius => .01 * Math.pow(radius, 2),
      }),
      highPixels: new RandomPixels({randomAlpha: true}),
      fillCircle: new Circle({
        center: [this.xBounds.center, this.yBounds.center],
        fillColor: [0, 0, 0, 0],
        width: 100,
      }),
    }
  }

  getLayers(drawables) {
    return {
      layers: [
        {
          layers: [
            {
              drawable: drawables.backgroundXYHue,
            },
            {
              layers: [
                {
                  name: 'bassLine',
                  drawable: drawables.bassLine,
                  blendMode: 'add',
                },
                {
                  name: 'bassCircle',
                  drawable: drawables.bassCircle,
                  blendMode: 'add',
                },
              ],
              blendMode: 'multiply',
              alpha: 0.99,
            },
          ],
        },
        {
          name: 'highPixels',
          drawable: drawables.highPixels,
          blendMode: 'normal',
        },
        {
          name: 'rotor',
          drawable: drawables.rotor,
          blendMode: 'normal',
        },
        {
          name: 'rainDots',
          drawable: drawables.rainDots,
          blendMode: 'normal',
          alpha: 0.3,
        },
        {
          name: 'fillCircle',
          drawable: drawables.fillCircle,
          blendMode: 'normal',
          alpha: 0.1,
        },
      ],
    };
  }

  updateState() {
    this.layers.bassCircle.enabled = this.config.bassCircle;
    this.layers.bassLine.enabled = this.config.bassLine;
    this.layers.fillCircle.enabled = this.config.fillCircle;
    this.layers.highPixels.alpha = this.config.highLayerAlpha;
    this.layers.rotor.alpha = this.config.rotorAlpha;
    this.layers.rainDots.alpha = this.config.rainDotsAlpha;
    const centerChannel = this.currentAudioFrame.center;
    if (!centerChannel) {
      return;
    }
    const audioSummary = centerChannel.summary;
    const highNoBass = audioSummary.highRmsNoBass;
    const normalizedBass = audioSummary.bassPeakDecay;
    this.drawables.backgroundXYHue.xOffset = .01 * this.xBounds.scale * Math.cos(
      Math.PI * this.timeInMs / 5000
    );
    this.drawables.backgroundXYHue.yOffset = .01 * this.yBounds.scale * Math.cos(
      Math.PI * this.timeInMs / 3000
    );
    this.drawables.bassLine.center[1] = this.yBounds.center + Math.cos(
      Math.PI * this.timeInMs / 5000) * this.yBounds.scale  / 2;
    this.drawables.bassLine.width = 2 * normalizedBass;
    this.drawables.rotor.angle = Math.cos(Math.PI * this.timeInMs/5000) * ((Math.PI * this.timeInMs / 500) % Math.PI);
    this.drawables.bassCircle.radius = 10 + 50 * Math.pow(normalizedBass, 2);
    this.drawables.rainDots.offset = -this.timeInMs/50;
    this.drawables.rainDots.center[0] = this.xBounds.center + Math.cos(
      Math.PI * this.timeInMs / 7000) * this.xBounds.scale / 3;
    this.drawables.highPixels.threshold = 1 - .1*highNoBass;
    this.drawables.fillCircle.radius = 300 * (3000 - (this.timeInMs%3000))/3000;
  }

  static presets() {
    return {
      "default": {velocidad: 0.4, whiteBorder: true},
      "gold": {velocidad: 0.1, whiteBorder: false, escala: 0.5, color: 0.42}
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.bassCircle = {type: Boolean, default: true}
    res.bassLine = {type: Boolean, default: true}
    res.fillCircle = {type: Boolean, default: false}
    res.highLayerAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    res.rotorAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    res.rainDotsAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    return res;
  }
}
