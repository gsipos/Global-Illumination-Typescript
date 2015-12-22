import Vector from '../../general/vector';

export enum MaterialModel {
    DIFFUSE,
    SPECULAR,
    REFRACTOR,
    REFLECTOR,
    ALL,
    NONE
}

export interface BRDFSample {
    materialModel?: MaterialModel;
    direction?: Vector;
    probability: number;
    inAir?: boolean;
}