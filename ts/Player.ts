/**
 * Created by memo on 26.01.2017.
 */
class PlayerWrapper extends SerializableObject implements Person{
    pos : MapPosition;
    id : number;

    constructor() {
        super();
        this.id = -1;
    }

    static revive(data: any): any {
        let player = new PlayerWrapper();
        return player.revive(data);
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let playerTarget = target as PlayerWrapper;
        copy.pos = playerTarget.pos.copy();
        copy.id = playerTarget.id;

        return copy;
    }
}

class Player {
    private static instance : PlayerWrapper;
    static get() : PlayerWrapper {
        if (!this.instance) {
            this.instance = new PlayerWrapper();
        }

        this.instance.pos = new MapPosition($gamePlayer._realX, $gamePlayer._realY, $gameMap._mapId);
        return this.instance;
    }
}