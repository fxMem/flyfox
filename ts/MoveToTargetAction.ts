/**
 * Created by memo on 21.01.2017.
 */
type targetValidCallbackType = (context : ActionContext) => boolean;

class MoveToTargetAction extends BotCompositeAction{
    private destination: MapPosition;
    private needRestoreChildDoneCallback: boolean;
    constructor(private target : Person, private isTargetValidCallback : targetValidCallbackType) {
        super();
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target) as MoveToTargetAction;
        let actionSource = source as MoveToTargetAction;

        if (actionSource.currentAction) {
            copy.needRestoreChildDoneCallback = true;
        }

        copy.destination = actionSource.destination.copy();
        copy.target = RevivePerson(actionSource.target);
         
        return copy;
    }

    update(context: ActionContext): void {
        if (this.needRestoreChildDoneCallback) {
            this.currentAction.doneCallback = () => {
                return this.isDoneCallback();
            };

            this.needRestoreChildDoneCallback = false;
        }

        super.update(context);
    }

    protected onCompositeUpdate() : void {
        if (!this.target) {
            this.finish();
            return;
        }

        if (!this.destination) {
            this.destination = this.getDestination();
        }

        // what should be done id target moves and changes its position?
        // maybe recalculate destination here?
        if (this.destination.equals(this.bot.pos)) {
            this.onTargetReached();
            this.finish();
            return;
        }

        this.invokeMove(this.destination, () => {
            return this.isDoneCallback();
        });
    }

    protected onTargetReached() : void {
        this.bot.turnTo(this.target.pos);
    }

    protected isDoneCallback() : boolean {
        let target = this.target;
        if (target && !this.isTargetValidCallback(this.context)) {
            target = null;
        }

        if (!target) {
            return true;
        }

        return this.isTargetReached();
    }

    private getDestination() : MapPosition {
        let targetMapId = this.target.pos.mapId;
        let targetMap = World.instance.getMap(targetMapId);
        let destination = targetMap.getNearFreePoint(this.target.pos);
        return MapPosition.create(destination, targetMap.id);// { ...destination, mapId : targetMap.id };
    }

    private isTargetReached(): boolean {
        return this.target.pos.near(this.bot.pos);
    }
}

//Factories.actionFactory.register(MoveToTargetAction);

// Only works across single map. Need rework
/*
class MoveToTargetAction extends MoveAction{
    constructor(private target : Person, private isTargetValidCallback : targetValidCallbackType) {
        super(null);
    }

    protected onUpdate() : void {
        if (!this.destination) {
            this.destination = this.getDestination();
        }

        super.onUpdate();
    }

    protected onTargetReached() : void {
        this.bot.turnTo(this.target.pos);
        super.onTargetReached();
    }

    protected isDone() : boolean {
        let target = this.target;
        if (target && !this.isTargetValidCallback(this.context)) {
            target = null;
        }

        if (!target) {
            return false;
        }

        return !this.isTargetReached();
    }

    private getDestination() : MapPosition {
        let targetMapId = this.target.pos.mapId;
        let targetMap = $world.getMap(targetMapId);
        let destination = targetMap.getNearFreePoint(this.target.pos);
        return MapPosition.create(destination, targetMap.id);// { ...destination, mapId : targetMap.id };
    }

    private isTargetReached() : boolean {
        let map = this.context.map;
        return map.isNearBot(this.target, this.bot.pos);
    }
}*/

Types.register(MoveToTargetAction);