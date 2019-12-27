const tumult = require("tumult");
const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("../utils/ColorUtils");

function rescale(x, min, max) {
  return Math.floor((x + 1) * (max - min) + min);
}

// A simple program based on Simplex noise to generate
// a random cloud of colors.
module.exports = class Noise extends LightProgram {
  constructor(config, geometry) {
    super(config, geometry);
  }

  init() {
    this.time = 0;
    this.noise = new tumult[this.config.noise]()
  }

  drawFrame(draw) {
    this.time += this.config.speed;

    const noise = this.noise;
    const { x, y } = this.geometry;
    const offset = this.config.offset;
    const t = this.time / 1000;

    var colors = new Array(this.numberOfLeds);
    for (let i = 0; i < colors.length; i++) {
        const r = noise.gen(x[i] / 32 + t, y[i] / 32 + t)
        const g = noise.gen(x[i] / 32 + t, y[i] / 32 + t + 100)
        const b = noise.gen(x[i] / 32 + t, y[i] / 32 + t + 200)
        colors[i] = [r, g, b].map(v => rescale(v, 0, 255));
    }
    draw(colors);
  }

  updateConfig(config) {
    super.updateConfig(config);
    this.noise = new tumult[this.config.noise]()
  }

  static configSchema() {
    let config = super.configSchema();
    config.speed = { type: Number, min: 1, max: 30, default: 5 };
    config.offset = { type: Number, min: 1, max: 100, default: 13 };
    config.noise = { type: String, values: ["Simplex2", "Perlin2"], default: "Simplex2" };
    return config;
  }
};
