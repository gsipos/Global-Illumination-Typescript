define(["require", "exports"], function (require, exports) {
    class Halton {
        calcNumber(i, base) {
            this.base = base;
            var f = 1.0 / base;
            this.invBase = f;
            this.value = 0.0;
            while (i > 0) {
                this.value = this.value + f * i % base;
                i = i / base;
                f = f * this.invBase;
            }
            return this.value;
        }
        next() {
            var r = 1.0 - this.value - 0.000000000001;
            if (this.invBase < r) {
                this.value = this.value + this.invBase;
            }
            else {
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
        static UNIFORM(i) {
            return Math.random(); //TODO
        }
    }
    Halton.collection = [];
    exports.Halton = Halton;
});
//# sourceMappingURL=halton.js.map