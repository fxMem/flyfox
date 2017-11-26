/**
 * Created by memo on 24.01.2017.
 */

class PubMap extends Map{
    static typeIdentifier = "pubMap";
    constructor(a : MapConstructorParameters) {
        super(a);
    }
}



class PubWaitingPoint extends Checkpoint{
    static typeIdentifier = "pubWaitingPoint";
    constructor(a : CheckpointConstructorParameters) {
        super(a);
    }
}

class PubWaitressSpawn extends SpawnCheckpoint{
    static typeIdentifier = "pubWaitress";
    constructor(a : CheckpointConstructorParameters) {
        super(a);
    }

    createBot(a : BotConstructorParameters) : Bot {
        return new WaitressBot(a);
    }
}

class WaitressBot extends Bot {
    constructor(a : BotConstructorParameters) {
        super(a);

        this.appearance = {
            random: false,
            title: "People2",
            id: 5
        };

        let sb = new TimeBotStateBuilder();
        let state = sb.
            createPeriod(0, 24).
                addAction(ProcessCustomerAction).
                addAction(WaitAction).
            build();

        this.addAvailableState(state);
    }
}

class ProcessCustomerAction extends BotCompositeAction {
    private workDone = false;
    private target : Person;

    constructor() {
        super();
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let actionSource = source as ProcessCustomerAction;
        copy.target = RevivePerson(actionSource.target);
        copy.workDone = actionSource.workDone;

        return copy;
    }

    protected onCompositeUpdate() : void {
        if (this.workDone) {
            if (this.bot.atStartPosition()) {
                this.bot.turnDefault();
                this.finish();
            }
            else {
                this.return();
            }

            return;
        }

        if (this.target && !this.targetValid()) {
            this.target = null;
        }

        if(!this.target) {
            this.target = this.findTarget();
        }

        if (!this.target) {
            this.return();
            this.dropWork();
            return;
        }

        if (this.isNearCustomer()) {
            this.doWork();
            this.wait(5, TimeInterval.Second);
            return;
        }

        this.moveToCustomer();
    }

    private dropWork() : void {
        this.workDone = true;
    }

    private doWork() : void {
        this.workDone = true;
    }

    private return() : void {
        this.invokeMove(this.bot.initialPosition());
    }

    private isNearCustomer() : boolean {
        return this.target.pos.near(this.bot.pos);
    }

    private moveToCustomer() {
        this.invokeAction(new MoveToTargetAction(this.target, (c) => { return this.targetValid(); }))
    }

    private findTarget() : Person {
        let target : Person = null;
        this.map.traverseCharacters(ProcessCustomerAction.isWaitingPoint, (p, c) => {
            if (target) {
                return;
            }

            if (!ProcessCustomerAction.isBooked(p, this.session)) {
                target = p;
            }
        });

        if (target) {
            this.book(target);
        }

        return target;
    }

    private book(target : Person) : void {
        let pubContext = this.session.pub = (this.session.pub || {});
        let bookedClients = pubContext.booked = (pubContext.booked || []);
        let botId = target.id;
        bookedClients.push(botId);
    }

    private targetValid() : boolean {
        return this.target && this.isWaitPoint(this.target.pos);
    }

    private static isWaitingPoint(c : Checkpoint) : boolean {
        return c instanceof PubWaitingPoint
    }

    private isWaitPoint(p : MapPosition) : boolean {
        return this.map.forAnyCheckpoint((c) => {
            return ProcessCustomerAction.isWaitingPoint(c) && c.pos.equals(p);
        });
    }

    static evaluatePriority(context: SelectActionContext): ActionEvaluationResult {
        let result = -1;
        let typeId = getTypeId(ProcessCustomerAction);
        if (!context.bot.isVisible()) {
            return new ActionEvaluationResult(typeId, result);
        }

        let map = context.updateContext.map;
        let gotCustomer = map.isSomeoneAtCheckpoint((c) => {
           return c instanceof PubWaitingPoint;
        }, (p) => {
            return !ProcessCustomerAction.isBooked(p, context.session);
        });

        if (gotCustomer) {
            result = 1000;
        }

        return new ActionEvaluationResult(typeId, result);
    }

    static isBooked(p : Person, session : any) : boolean {
        let pubContext = session.pub = (session.pub || {});
        let bookedClients = pubContext.booked = (pubContext.booked || []);
        let botId = p.id;
        return bookedClients.indexOf(botId) != -1;
    }
}

Types.register(PubMap);
Types.register(WaitressBot);
Types.register(PubWaitingPoint);
Types.register(PubWaitressSpawn);
Types.register(ProcessCustomerAction);