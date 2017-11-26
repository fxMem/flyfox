/**
 * Created by memo on 21.01.2017.
 */
abstract class BotCompositeAction extends BotAction{
    protected currentAction: BotAction;

    constructor(doneCallback? : Func<boolean>) {
        super(doneCallback);
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let actionSource = source as BotCompositeAction;
        copy.currentAction = actionSource.currentAction && BotAction.revive(actionSource.currentAction);

        return copy;
    }

    onUpdate() : void {
        if (this.runningSubAction()) {
            this.currentAction.update(this.context);
        }
        else {
            this.onCompositeUpdate();
        }
    }

    protected runningSubAction(): boolean {
        return this.currentAction && this.currentAction.isRunning();
    }

    protected isDone(): boolean {
        if (this.currentAction && this.currentAction.isRunning()) {
            return false;
        }
        else {
            return super.isDone();
        }
    }

    protected invokeAction(action : BotAction) : void {
        this.currentAction = action;
        this.currentAction.start();
    }

    protected invokeMove(destination : MapPosition, doneCallback? : Func<boolean>) : void {
        let moveAction = null;
        if (destination.mapId == this.bot.mapId()) {
            moveAction = new MoveAction(destination, doneCallback);
        }
        else {
            moveAction = new CrossMapMoveAction(destination, doneCallback);
        }

        this.invokeAction(moveAction);
    }

    protected wait(duration : number, interval : TimeInterval, turnAround : boolean = false) : void {
        let mult = 60;
        if (interval == TimeInterval.Minute) {
            mult *= 60;
        }
        else if (interval == TimeInterval.Hour) {
            mult *= 3600;
        }

        this.invokeAction(new WaitAction({ duration, turnAround, mult }));
    }

    protected onStart() : void {

    }

    protected onFinish() : void {

    }

    protected abstract onCompositeUpdate() : void;
}