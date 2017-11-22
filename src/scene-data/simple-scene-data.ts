import Plane from "../path-tracing/object/plane";


type Number3 = [number, number, number];
export interface MaterialData {
    diffKd: Number3;
    specKs: Number3;
    specShine: number;
    refractKt: Number3;
    reflectKr: Number3;
    refractNt: number;
    cLe?: Number[]
}

interface ObjectData {
    kind: string;
    name?: string;
    baseMat: keyof SceneData["materials"];
    customMat?: Partial<MaterialData>;
}

interface PlaneData extends ObjectData {
    kind: 'plane';
    min: Number3;
    max: Number3;
    dir: string;
}

type WorldObjectData = PlaneData;

export interface SceneData {
    camera: {
        height: number;
        width: number;
        maxTraceDepth: number;
        lightSamples: number;
        gatherWalks: number;
        rowsToRender: number;
        eye: Number3;
        picmin: Number3;
        picmax: Number3;
    }
    materials: { [materialKey: string]: MaterialData };
    objects: WorldObjectData[];
}

const createLight = (c: Number3, energy: number) => ({
    diffKd: c,
    specKs: c,
    cLe: c.map(x => energy * x),
    specShine: 500,
    refractKt: [0, 0, 0],
    reflectKr: [0, 0, 0],
    refractNt: 1.52
} as MaterialData);

export const simpleSceneData: SceneData = {
    camera: {
        width: 800,
        height: 800,
        maxTraceDepth: 30,
        lightSamples: 5,
        gatherWalks: 5000,
        rowsToRender: 50,
        eye: [150, 105, 150],
        picmax: [175, 130, 175],
        picmin: [125, 130, 125]
    },
    materials: {
        glass: {
            diffKd: [0, 0, 0],
            specKs: [2, 2, 2],
            specShine: 50,
            refractKt: [0.7, 0.7, 0.7],
            reflectKr: [0.3, 0.3, 0.3],
            refractNt: 1.52
        },
        mirror: {
            diffKd: [0.1, 0.1, 0.1],
            specKs: [2, 2, 2],
            specShine: 200,
            refractKt: [0, 0, 0],
            reflectKr: [1, 1, 1],
            refractNt: 1.52
        },
        greyDiffuse: {
            diffKd: [0.3, 0.3, 0.3],
            specKs: [1, 1, 1],
            specShine: 100,
            refractKt: [0, 0, 0],
            reflectKr: [0, 0, 0],
            refractNt: 1.52
        }
    },
    objects: [
        {
            kind: "plane",
            name: "floor",
            min: [100, 100, 100],
            max: [200, 250, 100],
            dir: "up",
            baseMat: "greyDiffuse"
        }
    ]
};