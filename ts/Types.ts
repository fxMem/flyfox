/**
 * Created by memo on 16.01.2017.
 */
class TypesCollection<T> {
    private map: { [id: string]: T } = {};

    register(a: T): void {
        let typeId = getTypeId(a);
        if (typeId) {
            this.map[typeId] = a;
        }
    }

    getType(id: string): T {
        return this.map[id];
    }
}



function isMap(a: any): a is Constructor<Map> {
    return a.prototype && a.prototype instanceof Map;
}

function isCheckpoint(a: any): a is Constructor<Checkpoint>{
    return a.prototype && a.prototype instanceof Checkpoint;
}

function isAction(a: any): a is BotActionConstructor {
    return a.prototype && a.prototype instanceof BotAction;
}

function isBot(a: any): a is BotConstructor {
    return a.prototype && a.prototype instanceof Bot;
}

class Types {
    static maps = new TypesCollection<Constructor<Map>>();
    static checkpoints = new TypesCollection<Constructor<Checkpoint>>();
    static bots = new TypesCollection<BotConstructor>();
    static actions = new TypesCollection<BotActionConstructor>();

    static register(a: any): void {
        if (isMap(a)) {
            Types.registerMap(a);
        }
        else if (isCheckpoint(a)) {
            Types.registerCheckpoint(a);
        }
        else if (isAction(a)) {
            Types.registerAction(a);
        }
        else if (isBot(a)) {
            Types.registerBot(a);
        }
        else {
            throw new FlyfoxError("Cannot register supplied object. U shold provide Map, Bot, Checkpoint or BotAction constructor.");
        }
    }

    static registerMap(a: Constructor<Map>): void {
        Factories.mapFactory.register(a);
        Types.maps.register(a);
    }

    static registerCheckpoint(a: Constructor<Checkpoint>): void {
        Factories.checkPointFactory.register(a);
        Types.checkpoints.register(a);
    }

    static registerAction(a: BotActionConstructor): void {
        Types.actions.register(a);
    }

    static registerBot(a: BotConstructor): void {
        Types.bots.register(a);
    }
}

