/**
 * Created by memo on 21.01.2017.
 */


interface BotActionConstructor {
    new (): BotAction;
    evaluatePriority?(context : SelectActionContext) : ActionEvaluationResult;
    priority? : number
}

abstract class BotAction extends SerializableObject {
    private running: boolean;
    protected finished: boolean;
    protected bot : Bot;
    protected context : ActionContext;
    protected session : any;
    protected map : Map;

    constructor(public doneCallback?: Func<boolean>) {
        super();
        
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let actionSource = source as BotAction;
        copy.running = actionSource.running;
        copy.finished = actionSource.finished;

        return copy;
    }

    static revive(data: any): BotAction {
        let actionType = data.typeId;
        let constructor = Types.actions.getType(actionType);
        let instance = new constructor();

        return instance.revive(data);
    }

    isRunning() : boolean {
        return this.running;
    }

    start() : void {
        this.running = true;
        this.onStart();
    }

    finish() : void {
        this.running = false;

        this.onFinish();
    }

    update(context : ActionContext) : void {
        if (!this.running) {
            return;
        }

        this.context = context;
        this.session = context.session;
        this.map = context.map;
        this.bot = context.bot;

        if (!this.bot.isActive()) {
            return;
        }

        if (this.isDone()) {
            this.finish();
        }
        else {
            this.onUpdate();
        }
    }

    protected isDone() : boolean {
        if (this.doneCallback) {
            return this.doneCallback();
        }

        return this.finished;
    }

    protected abstract onStart() : void;
    protected abstract onFinish() : void;
    protected abstract onUpdate() : void;
}