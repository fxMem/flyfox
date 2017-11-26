/**
 * Created by memo on 22.01.2017.
 */
/*interface BotStateConstructor {
    new(parameters : any) : BotState;
}*/

abstract class BotState extends SerializableObject {
    protected actions: string[];

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let stateSource = source as BotState;
        copy.actions = stateSource.actions.slice();

        return copy;
    }

    selectAction(context : ActionContext) : BotActionConstructor {
        let selectedAction : BotActionConstructor;
        let evaluationContext = new SelectActionContext(context);

        for (let actionTypeId of this.actions) {
            let actionType = Types.actions.getType(actionTypeId);

            let evaluationResult = this.evaluatePriority(actionType, evaluationContext);
            evaluationContext.results.push(evaluationResult);
            if (evaluationResult.force) {
                selectedAction = actionType;
                break;
            }
        }
        if (!selectedAction) {
            selectedAction = this.chooseAction(evaluationContext);
        }

        return selectedAction;
    }

    addAction(a: BotActionConstructor): void {
        this.actions.push(getTypeId(a));
    }

    private evaluatePriority(actionType : BotActionConstructor, context : SelectActionContext) : ActionEvaluationResult {
        if (actionType.evaluatePriority) {
            return actionType.evaluatePriority(context);
        }
        else {
            return new ActionEvaluationResult(getTypeId(actionType), actionType.priority || 0);
        }
    }

    private chooseAction(context : SelectActionContext) : BotActionConstructor {
        context.results.sort(function (a, b) {
            return a.priority - b.priority;
        });

        let count = context.results.length;
        var actionId = context.results[count - 1].actionId;
        return Types.actions.getType(actionId);
    }

    abstract applicable(context : SelectStateContext) : boolean;
    abstract dispose() : void;
    abstract activate() : void;
}



class ActionEvaluationResult {
    constructor(public actionId : string, public priority : number, public force : boolean = false) {

    }
}

class SelectStateContext {

}

class SelectActionContext {
    results : ActionEvaluationResult[] = [];
    session : any;
    bot : Bot;

    constructor(public updateContext : ActionContext) {
        this.updateContext = updateContext;
        this.bot = updateContext.bot;
        this.session = updateContext.session;
    }
}

interface TimeBotStateConstructorParameters {
    startHour : number;
    endHour : number;
    actions? : BotActionConstructor[]
}

class TimeBotState extends BotState {
    constructor(public interval : DayInterval) {
        super();
        this.actions = [];
    }

    applicable(): boolean {
        let currentTime = World.instance.time;
        return this.interval.contains(currentTime);
    }

    dispose() : void {

    }

    activate() : void {

    }
}

class CompositeTimeBotState extends TimeBotState {
    private periods : TimeBotState[] = [];
    constructor(interval : DayInterval) {
        super(interval);
    }

    addPeriod(a : TimeBotState) : void {
        for (let period of this.periods) {
            if (period.interval.intersects(a.interval)) {
                throw new Error("Cannot add intersectings intervals to composite time state!");
            }
        }

        this.periods.push(a);
    }

    selectAction(context: ActionContext): BotActionConstructor {
        let currentTime = World.instance.time;
        for (let period of this.periods) {
            if (period.interval.contains(currentTime)) {
                return period.selectAction(context);
            }
        }
    }
}