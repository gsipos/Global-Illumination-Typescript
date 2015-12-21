define(["require", "exports"], function (require, exports) {
    (function (MaterialModel) {
        MaterialModel[MaterialModel["DIFFUSE"] = 0] = "DIFFUSE";
        MaterialModel[MaterialModel["SPECULAR"] = 1] = "SPECULAR";
        MaterialModel[MaterialModel["REFRACTOR"] = 2] = "REFRACTOR";
        MaterialModel[MaterialModel["REFLECTOR"] = 3] = "REFLECTOR";
        MaterialModel[MaterialModel["ALL"] = 4] = "ALL";
        MaterialModel[MaterialModel["NONE"] = 5] = "NONE";
    })(exports.MaterialModel || (exports.MaterialModel = {}));
    var MaterialModel = exports.MaterialModel;
});
//# sourceMappingURL=general-material.js.map