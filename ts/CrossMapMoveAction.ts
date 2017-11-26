/**
 * Created by memo on 28.01.2017.
 */
class CrossMapMoveAction extends BotCompositeAction {
    private mapsTree: { [mapId: number]: number };
    private nextExit: CheckpointRef;

    constructor(protected destination : MapPosition, doneCallback? : Func<boolean>) {
        super(doneCallback);
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let actionSource = source as CrossMapMoveAction;
        copy.destination = actionSource.destination.copy();
        copy.mapsTree = { ...actionSource.mapsTree };
        copy.nextExit = actionSource.nextExit.copy();

        return copy;
    }

    protected onCompositeUpdate(): void {
        if (!this.mapsTree) {
            this.buildTree();
        }

        let nextExit: ExitCheckpoint;
        if (!this.nextExit || this.bot.mapId() != this.nextExit.mapId) {
            nextExit = this.defineNextExit();
            this.nextExit = nextExit && nextExit.getRef();
        }
        else {
            nextExit = this.bot.getMap().points[this.nextExit.checkpointId] as ExitCheckpoint;
        }

        if (this.destinationMapReached()) {
            this.invokeMove(this.destination);
            this.finished = true;
            return;
        }

        if (this.bot.pos.equals(nextExit.pos)) {
            this.proceedToNextMap(nextExit);
        }
        else {
            this.invokeMove(nextExit.pos);
        }
    }

    private proceedToNextMap(exit : ExitCheckpoint) {
        this.bot.setPosition(exit.target);
    }

    private buildTree() : void {
        let currentMapId = this.bot.mapId();
        let destinationMapId = this.destination.mapId;
        let destinationMap = World.instance.getMap(destinationMapId);
        this.mapsTree = {};

        let q = [destinationMap];
        let color = 1;
        let currentWaveCount = 1;
        while (1) {
            if (!q.length) {
                break;
            }

            let nextMap = q.shift();
            this.mapsTree[nextMap.id] = color;
            currentWaveCount--;

            if (nextMap.id == currentMapId) {
                break;
            }

            let exits = nextMap.exitsToCurrentTown();
            for (let i = 0; i < exits.length; i++) {
                let nextExit = exits[i];
                let targetMapId = nextExit.target.mapId;
                if (this.mapsTree[targetMapId]) {
                    continue;
                }

                q.push(World.instance.getMap(targetMapId));
            }

            if (!currentWaveCount) {
                currentWaveCount = q.length;
                color++;
            }
        }

        if (!this.mapsTree[currentMapId]) {
            throw new Error("Cannot find path to destination map!");
        }
    }

    private defineNextExit() : ExitCheckpoint {
        let currentMap = this.bot.getMap();
        let currentMapId = currentMap.id;
        if (this.destinationMapReached()) {
            return;
        }

        let currentColor = this.mapsTree[currentMapId];
        let currentMapExits = currentMap.exitsToCurrentTown();
        for (let exit of currentMapExits) {
            let targetMapId = exit.target.mapId;
            let targetMapColor = this.getMapsColor(targetMapId);
            if (targetMapColor == currentColor - 1) {
                return exit;
            }
        }
    }

    private destinationMapReached() : boolean {
        return this.bot.mapId() == this.destination.mapId;
    }

    private getMapsColor(mapId : number) : number {
        return this.mapsTree[mapId];
    }
}

Types.register(CrossMapMoveAction);
//Factories.actionFactory.register(CrossMapMoveAction);