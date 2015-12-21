export default class Halton {
    public value: number;
    public invBase: number;
    public base: number;

    public calcNumber(i: number, base: number): number {
        this.base = base;
        var f: number = 1.0 / base;
        this.invBase = f;
        this.value = 0.0;
        while (i > 0) {
            this.value = this.value + f * i % base;
            i = i / base;
            f = f * this.invBase;
        }
        return this.value;
    }

    public next(): number {
        var r: number = 1.0 - this.value - 0.000000000001;
        if (this.invBase < r) {
            this.value = this.value + this.invBase;
        } else {
            var h = this.invBase;
            var hh = h;
            do {
                var hh = h;
                h = h * this.invBase;
            } while (h >= r);
            this.value = this.value + hh + h - 1.0;
        }
        return this.value;
    }

    static collection: Halton[] = [];

    static UNIFORM(i: number): number {
        return Math.random(); //TODO
    }
}