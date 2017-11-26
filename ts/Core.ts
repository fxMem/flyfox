/**
 * Created by memo on 21.01.2017.
 */
function getTypeId(type: any): string {
    return getConstructor(type).name;
}

function getConstructor(o: any): any {
    if (o.prototype) {
        return o.prototype.constructor;
    }
    else if (o.__proto__) {
        return o.__proto__.constructor;
    }
    else {
        throw new Error("Cannot determine typeId for supplied object");
    }
}

//var IGNORE_FIELDS: Dictionary<Dictionary<number>> = {};
//function JsonIgnore(cls: any, name: string) {
//    let clsName = getTypeId(cls);
//    let list: Dictionary<number>;

//    var ignoredFields = IGNORE_FIELDS[clsName];
//    if (!ignoredFields) {
//        list = {};
//        IGNORE_FIELDS[clsName] = list;
//    }

//    list[name] = 1;
//}

class FlyfoxObject {
    notes : NoteParameters;

    constructor () {

    }
}

class SerializableObject {
    private typeId: string;

    constructor() {
        this.typeId = getTypeId(this);
    }

    private createInstance(): any {
        let constructor = getConstructor(this);
        return new constructor();
    }

    serialize(source: any, target: any): any {
        return target;
    }

    pack(): any {
        return this.serialize(this, {});
    }

    copy(): any {
        return this.serialize(this, this.createInstance());
    }

    revive(data: any): any {
        return this.serialize(data, this);
    }
}

enum TimeInterval {
    Second,
    Minute,
    Hour
}

class MapPosition {
    constructor(public x : number, public y : number, public mapId : number) {

    }

    equals(a : MapPosition) : boolean {
        return a.x == this.x && a.y == this.y && a.mapId == this.mapId;
    }

    near(a : MapPosition) : boolean {
        return (this.x == a.x && Math.abs(this.y - a.y) == 1 ||
                this.y == a.y && Math.abs(this.x - a.x) == 1) && this.mapId == a.mapId;
    }

    copy(): MapPosition {
        return MapPosition.copy(this);
    }

    static copy(original : MapPosition) : MapPosition {
        return new MapPosition(original.x, original.y, original.mapId);
    }

    static create(a : {x : number, y : number, mapId? : number}, mapId? : number) {
        return new MapPosition(a.x, a.y, a.mapId || mapId);
    }
}

interface LocalPosition {
    x : number,
    y : number
}

function checkProbability(successRate : number) : boolean {
    var limit = successRate / 100;
    var seed = Math.random();
    return (seed <= limit);
}

function getRandomIndex<T>(a : T[]) : number {
    return Math.randomInt(a.length);
}