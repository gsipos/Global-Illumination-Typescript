export default class Color {

    constructor(public r: number = 0, public g: number = 0, public b: number = 0) { }

    static scale(k: number, v: Color) { return new Color(k * v.r, k * v.g, k * v.b); }
    static plus(v1: Color, v2: Color) { return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b); }
    static times(v1: Color, v2: Color) { return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b); }

    static white = new Color(1.0, 1.0, 1.0);
    static grey = new Color(0.5, 0.5, 0.5);
    static black = new Color(0.0, 0.0, 0.0);

    static toDrawingColor(c: Color) {
        var legalize = d => d > 1 ? 1 : d;
        return {
            r: Math.floor(legalize(c.r) * 255),
            g: Math.floor(legalize(c.g) * 255),
            b: Math.floor(legalize(c.b) * 255)
        }
    }

    static legalize(c: Color) {
        var legalize = d => d > 1 ? 1 : d;
        return new Color(legalize(c.r), legalize(c.g), legalize(c.b));
    }

    static luminance(c: Color): number { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }
}