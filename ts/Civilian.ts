/**
 * Created by memo on 28.01.2017.
 */
class CivilianSpawnPoint extends SpawnCheckpoint{
    static typeIdentifier = "civilian";
    constructor(a : CheckpointConstructorParameters) {
        super(a);
    }

    createBot(a : BotConstructorParameters) : Bot {
        return new Civilian(a);
    }
}

class HomeMap extends Map {
    static typeIdentifier = "homeMap";
    constructor(a : MapConstructorParameters) {
        super(a);
    }
}

class Civilian extends Bot{
    constructor(a : BotConstructorParameters) {
        super(a);

        this.appearance = {
            random: false,
            title: "People2",
            id: 1
        };

        let sb = new TimeBotStateBuilder();
        let state = sb.
            createPeriod(0, 24).
            addAction(LazyWalkAction).
            //addAction(WaitAction).
            build();

        this.addAvailableState(state);
    }
}

class LazyWalkAction extends BotCompositeAction {
    private nextPoint: MapPosition;
    private markedMaps: { [mapId: number]: number } = {};
    private nextCheckpoint: CheckpointRef;

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let actionSource = source as LazyWalkAction;
        copy.nextPoint = actionSource.nextPoint.copy();
        copy.markedMaps = { ...actionSource.markedMaps };
        copy.nextCheckpoint = actionSource.nextCheckpoint.copy();;

        return copy;
    }

    protected onCompositeUpdate(): void {
        if (!this.nextPoint) {
            this.selectNextPoint();
        }

        if (!this.nextPoint) {
            // return to initial position
            this.invokeMove(this.bot.initialPosition());
            this.finished = true;
            return;
        }

        if (!this.bot.atPosition(this.nextPoint)) {
            this.invokeMove(this.nextPoint);
        }
        else {
            let currentMap = this.bot.getMap();
            if (currentMap.id != this.nextCheckpoint.mapId) {
                throw new FlyfoxError("Something strange here: nextCheckpointMap is not current map!");
            }

            let nextCheckpoint = currentMap.points[this.nextCheckpoint.checkpointId] as ExitCheckpoint;
            this.bot.setPosition(nextCheckpoint.target);
            this.nextPoint = null;
            this.nextCheckpoint = null;
        }
    }

    private selectNextPoint(): void {
        let currentMap = this.bot.getMap();
        let newExits = [];
        let oldExits = [];
        
        currentMap.exitsToCurrentTown().forEach((exit) => {
            let targetMapId = exit.target.mapId;
            let targetMap = World.instance.getMap(targetMapId);
            if (!(targetMap instanceof StreetMap)) {
                return;
            }

            if (this.markedMaps[targetMapId]) {
                oldExits.push(exit);
            }
            else {
                newExits.push(exit);
            }
        });

        if (newExits.length) {
            let nextIndex = getRandomIndex(newExits);
            let nextCheckpoint = newExits[nextIndex] as ExitCheckpoint;

            this.nextCheckpoint = nextCheckpoint.getRef();
            this.nextPoint = nextCheckpoint.pos;
            this.markedMaps[nextCheckpoint.target.mapId] = 1;
        }
    }
}

Types.register(HomeMap);
Types.register(Civilian);
Types.register(CivilianSpawnPoint);
Types.register(LazyWalkAction);
