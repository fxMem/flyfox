/**
 * Created by memo on 16.01.2017.
 */
interface Dictionary<TValue> {
    [index: number]: TValue;
    [index: string]: TValue;
}

interface Action {
    () : void;
}

interface ParameterAction<T> {
    (a : T) : void;
}

interface Func<T> {
    () : T;
}

interface ParameterFunc<TInput, TOutput> {
    (a : TInput) : TOutput;
}

declare class StorageManager {
    static isLocalMode() : boolean;
}

declare function require(a : string) : any;

declare interface Math {
    randomInt(max : number) : number;
}

declare class LZString {
    static compressToBase64(a : string) : string;
    static decompressFromBase64(a : string) : string;
}

declare var $dataMap : any;
declare var $gameMap : any;
declare var SceneManager : any;
declare var Game_Character: any;
declare var Game_Interpreter: any;
declare var Scene_Map: any;
declare var Game_Message: any;
declare var Scene_Base: any;
declare var DataManager: any;
declare var $gamePlayer: any;

// for flyfox.Dialogues support
var $dialoguesData = null;

declare class Game_Event {
    protected _x : number;
    protected _y : number;
    protected _defaultRoute : any;
    protected _enabled : boolean;
    //protected _eventIndex : number;
    protected _sprite : Sprite_Character;

    constructor(mapId: number, eventId: number);
    protected processMoveCommand(command : any) : void;
    initialize(mapId : number, eventId : number) : void;
    locate(x : number, y : number) : void;
    setImage(title : string, id : number) : void;
    setMoveRoute(route : any) : void;
    setPriorityType(a : number) : void;
    isMoving(): boolean;
    start(): void;
    isTriggerIn(triggers: number[]): boolean;
    lock(): void;

}

declare class Sprite_Character {
    constructor(event : Game_Event);
}

declare interface String {
    padZero(a : number) : string;
}

declare interface Number {
    padZero(a : number) : string;
}

interface Array<T> {
    first(predicate: (a: T) => boolean): T;
}

if (!Array.prototype.first) {
    Array.prototype.first = function (predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (!value) {
                continue;
            }

            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

/*
class TypeDefinition<T> {
    constructor(public type : MapConstructor, public predicate : (params : any) => boolean) {

    }

    check(parameters : any) : boolean {
        return this.predicate(parameters);
    }

    create() : T {
        return new this.type();
    }
}*/
