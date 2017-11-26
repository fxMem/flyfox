///<reference path="Factory.ts"/>
/**
 * Created by memo on 20.01.2017.
 */

interface MapConstructorParameters extends ConstructorParameters {
    filename : string;
    data: any,
    outputBotCollection: BotCollection
}


class Map {
    id : number;
    townId : number;
    localMapId : number;
    filename : string;
    notes : NoteParameters;
    points : Checkpoint[] = [];
    exitIds : number[] = [];
    height : number;
    width : number;
    colors: number[][] = [];

    private typeId: string;
    private name : string;
    private title : string;
    private mapType: string;

    static nameParameter = "name";

    constructor(a: MapConstructorParameters) {
        this.typeId = getTypeId(this);
        this.id = a.id;
        this.filename = a.filename;
        this.notes = a.notes;

        this.parseName();
        this.initialize(a.data, a.outputBotCollection);
    }

    exitsToCurrentTown() : ExitCheckpoint[] {
        let town = World.instance.currentTown;
        return this.exitIds.map((e) => {
            return this.points[e] as ExitCheckpoint;
        }).filter((e) => {
            return town.containsMap(e.target.mapId);
        });
    }

    traverseCharacters(checkpointPredicate : ParameterFunc<Checkpoint, boolean>, callback : (p : Person, c : Checkpoint) => void) : void {
        this.traverseCheckpoints(checkpointPredicate, (c) => {
            let bot = this.getBot(c.pos);
            if (bot) {
                callback(bot, c);
            }

            let player = Player.get();
            if (player.pos.equals(c.pos)) {
                callback(player, c);
            }
        });
    }

    traverseCheckpoints(checkpointPredicate : ParameterFunc<Checkpoint, boolean>, callback : ParameterAction<Checkpoint>) : void {
        for(let checkpoint of this.points) {
            if (!checkpointPredicate(checkpoint)) {
                continue;
            }

            callback(checkpoint);
        }
    }

    forAnyCheckpoint(checkpointPredicate : ParameterFunc<Checkpoint, boolean>) : boolean {
        let soTrue = false;
        this.traverseCheckpoints(checkpointPredicate, () => {
           soTrue = true;
        });

        return soTrue;
    }

    isBotAtCheckpoint(checkpointPredicate : ParameterFunc<Checkpoint, boolean>, botPredicate? : ParameterFunc<Person, boolean>) : boolean {
        return this.forAnyCheckpoint((c) => {
            let bot = this.getBot(c.pos);
            return checkpointPredicate(c) && !!bot && (!botPredicate || (botPredicate(bot)));
        });
    }

    isPlayerAtCheckpoint(checkpointPredicate : ParameterFunc<Checkpoint, boolean>, botPredicate? : ParameterFunc<Person, boolean>) : boolean {
        return this.forAnyCheckpoint((c) => {
            let player = Player.get();
            return checkpointPredicate(c) && player.pos.equals(c.pos) && (!botPredicate || (botPredicate(player)));
        });
    }

    isSomeoneAtCheckpoint(checkpointPredicate : ParameterFunc<Checkpoint, boolean>, botPredicate? : ParameterFunc<Person, boolean>) : boolean {
        return this.isBotAtCheckpoint(checkpointPredicate, botPredicate) || this.isPlayerAtCheckpoint(checkpointPredicate, botPredicate);
    }

    isNearBot(bot : Person, pos : LocalPosition) : boolean {
        let target = bot;
        let map = this;
        let targetIsNear = false;
        this.traverseNearTiles(pos, (pos) => {
            if (targetIsNear) {
                return;
            }

            let bot = map.getBot(pos);
            if (bot && target && target == bot) {
                targetIsNear = true;
            }
        });

        return targetIsNear;
    }

    getBot(pos : LocalPosition) : Bot {
        let { x, y } = pos;
        /*if ($gameMap._mapId != this._globalId) {
            return null;
        }*/

        let events = $gameMap.eventsXy(x, y);
        let flyfoxEvent = events.first((e) => {
            return e instanceof BotEvent;
        });

        return flyfoxEvent && flyfoxEvent.bot;
    }

    getNearFreePoint(pos : LocalPosition) : LocalPosition {
        let target = null;
        this.traverseNearTiles(pos, (pos) => {
            if (target) {
                return;
            }

            if (this.isFree(pos)) {
                target = { ...pos };
            }
        });

        return target;
    }

    traverseNearTiles(pos : LocalPosition, callback : (pos : LocalPosition) => void) {
        this.checkTileAndRun({ x : pos.x, y : pos.y - 1 }, callback);
        this.checkTileAndRun({ x : pos.x, y : pos.y + 1 }, callback);
        this.checkTileAndRun({ x : pos.x - 1, y : pos.y }, callback);
        this.checkTileAndRun({ x : pos.x + 1, y : pos.y }, callback);
    }

    isPassable(pos : LocalPosition) : boolean {
        return this.colors[pos.y][pos.x] > 0;
    }

    isFree(pos : LocalPosition) : boolean {
        return this.isPassable(pos);
    }

    private checkTileAndRun(pos : LocalPosition, callback : (pos : LocalPosition) => void) {
        if (pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height) {
            callback(pos);
        }
    }

    private getTileId(x : number, y : number, mapData : any) : number {
        let z = 5;
        return mapData.data[(z * this.height + y) * this.width + x] || 0;
    }

    private getEvent(x : number, y : number, eventsMap : any) : any {
        return eventsMap[y] && eventsMap[y][x];
    }

    private getCheckpoint(x : number, y : number, color : number, event : any) : Checkpoint {
        if (!event) {
            return null;
        }

        let noteParameters = NoteParameters.create(event.note);
        return Factories.checkPointFactory.create({
            pos: new MapPosition(x, y, this.id),
            color,
            notes : noteParameters,
            id : this.points.length
        })
    }

    private getStaticBot(x: number, y: number, color: number, event: any, bots: BotCollection): StaticBotRef {
        if (!event) {
            return null;
        }

        let noteParameters = NoteParameters.create(event.note);
        if (noteParameters.isStaticBot()) {
            let name = noteParameters.getValue(Bot.nameParameter);
            if (!name) {
                throw new FlyfoxError("Static bot must have a name!");
            }

            return new StaticBotRef(bots.getNextId(), name, noteParameters.getValue(Bot.displayNameParameter));
        }
        else {
            return null;
        }
    }

    private parseName(): void {
        let displayName = this.notes.getValue(Map.nameParameter);
        if (!displayName) {
            displayName = "DefTown_-1_-1";
        }
        this.name = displayName;
        let temp = displayName.split("_");
        this.mapType = temp[0];
        this.townId = Number(temp[1]);
        this.localMapId = Number(temp[2]);
        this.title = temp[3];
    }

    private initialize(mapData: any, outputBots: BotCollection): void {
        this.height = mapData.height;
        this.width = mapData.width;
        let eventsMap = [];
        for (let i = 0; i < mapData.events.length; i++) {
            let event = mapData.events[i];
            if (!event) {
                continue;
            }

            let eX = event.x;
            let eY = event.y;
            if (!eventsMap[eY]) {
                eventsMap[eY] = [];
            }

            eventsMap[eY][eX] = event;
        }

        for (let y = 0; y < this.height; y ++) {
            this.colors[y] = [];
            for (let x = 0; x < this.width; x ++) {
                let color = this.getTileId(x, y, mapData);
                let event = this.getEvent(x, y, eventsMap);
                this.colors[y][x] = color;
                if (!event) {
                    continue;
                }

                let checkpoint = this.getCheckpoint(x, y, color, event);
                if (!checkpoint) {
                    let staticBot = this.getStaticBot(x, y, color, event, outputBots);
                    if (staticBot) {
                        outputBots.add(staticBot);
                    }

                    continue;
                }

                this.points.push(checkpoint);
                if (checkpoint instanceof ExitCheckpoint) {
                    checkpoint.setDestination(event.pages);
                    this.exitIds.push(checkpoint.id);
                }

                if (checkpoint instanceof SpawnCheckpoint) {
                    outputBots.add(checkpoint.createBot({
                        id: outputBots.getNextId(),
                        checkPoint: checkpoint
                    }));
                }
            }
        }
    }
}

