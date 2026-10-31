// pbf@3 ships without TypeScript types. This is the minimal surface used by @mapbox/vector-tile.
declare module "pbf" {
  export default class Pbf {
    constructor(buf: Uint8Array);
  }
}
