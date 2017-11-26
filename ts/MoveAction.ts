/**
 * Created by memo on 21.01.2017.
 */
class MoveAction extends BotAction{
    private targetReached : boolean;
    private colorMap : number[][];
    private sameStreakCounter : number;
    private maxSameStreakLength : number = 2;

    constructor(protected destination : MapPosition, doneCallback? : Func<boolean>) {
        super(doneCallback);
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let actionSource = source as MoveAction;

        copy.targetReached = actionSource.targetReached;
        copy.sameStreakCounter = actionSource.sameStreakCounter;
        copy.maxSameStreakLength = actionSource.maxSameStreakLength;
        copy.colorMap = actionSource.colorMap.map(sa => sa.slice());
        copy.destination = actionSource.destination.copy();

        return copy;
    }

    protected onUpdate() : void {
        this.move();
    }

    protected onFinish() : void {
        this.bot.moveDone();
    }

    protected onStart() : void {

    }

    protected onTargetReached(): void {
        this.finished = true;
    }

    private move() : void{
        if (this.bot.isEventMoving()) {
            return;
        }

        if (!this.colorMap) {
            this.initializeColorMap();
        }

        let { x, y } = this.bot.pos;
        let { x : targetX, y : targetY } = this.destination;

        if (x == targetX && y == targetY) {
            this.onTargetReached();
            return;
        }

        let nextPoint = this.getNextPoint();
        this.bot.queueMove(nextPoint);
    }

    private getNextPoint() : LocalPosition {
        let map = this.map;
        let { x, y } = this.bot.pos;

        let table = this.colorMap;
        let currentColor = table[y][x];
        if (!currentColor) {
            return null;
        }

        let future : LocalPosition[] = [];
        let same : LocalPosition[] = [];
        let previous : LocalPosition[] = [];
        map.traverseNearTiles(this.bot.pos, (pos) => {
            let { x, y } = pos;
            if (!map.isPassable(pos)) {
                return;
            }

            let res = {y : y, x : x};
            let col  = table[y][x];
            if (col == currentColor) {
                same.push(res);
            }
            else if (col == currentColor - 1) {
                future.push(res);
            }
            else {
                previous.push(res);
            }
        })

        if (checkProbability(1) && previous.length) {
            return previous.pop();
        }

        if (same.length && this.sameStreakCounter) {
            this.sameStreakCounter--;
            return same.pop();
        }
        else if (future.length) {
            this.sameStreakCounter = this.maxSameStreakLength;

            var nextIndex = getRandomIndex(future);
            return future[nextIndex];
        }

        if (same.length) {
            return same.pop();
        }
        else if (previous.length) {
            return previous.pop();
        }

        throw new Error("NO path");
    }

    private initializeColorMap() : void {
        let map = this.map;
        let pos = this.destination;
        let q : LocalPosition[] = [pos];
        let x = pos.x;
        let y = pos.y;
        let used : number[][] = [];
        this.colorMap = [];
        for (let i = 0; i < map.height; i++) {
            used[i] = [];
            this.colorMap[i] = [];
        }

        used[y][x] = 1;
        let currentColor = 1;
        let currentCount = 1;

        while (1) {
            if (!q.length) {
                break;
            }

            let next = q.shift();
            this.colorMap[next.y][next.x] = currentColor;
            currentCount--;

            map.traverseNearTiles(next, (pos) => {
                let {x, y} = pos;
                if (used[y][x] == 1) {
                    return;
                }

                if (!map.isPassable(pos)) {
                    return;
                }

                used[y][x] = 1;
                q.push({ x, y });
            });

            if (!currentCount) {
                currentCount = q.length;
                currentColor++;
            }
        }
    }
}

Types.register(MoveAction);