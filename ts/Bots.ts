/**
 * Created by memo on 19.01.2017.
 */

interface BotConstructor {
    new (a?: BotConstructorParameters): Bot;
}

interface BotConstructorParameters {
    id: number;
    checkPoint : SpawnCheckpoint;
    appearance? : BotAppearance;
}

interface BotAppearance {
    random: boolean;
    title : string;
    id : number;
}

interface BotInfo {
    //id: number;
    name: string;
    displayName: string;
    greeting: string;
    getIdentityString(): string;
}

interface Person extends SerializableObject {
    pos : MapPosition;
    id : number;
}

function RevivePerson(data: any): any {
    if (data instanceof Bot || data.id != -1) {
        return Bot.revive(data);
    }
    else {
        return PlayerWrapper.revive(data);
    }
}

class Bot extends SerializableObject implements Person, BotInfo {
    static defaultGreeting = "Welcome!";

    static greetingParameter = "greeting";
    static nameParameter = "name";
    static displayNameParameter = "displayName";

    appearance: BotAppearance;

    private debugIdentityString: string;
    private manager: BotManager;
    private event : BotEvent;
    private currentAction : BotAction;
    private state : BotState;
    private availableStates : BotState[] = [];
    private active : boolean;
    pos : MapPosition;
    rotating : number | null;
    destination : MapPosition;
    checkpoint : CheckpointRef;
    id: number;
    name: string;
    displayName: string;
    greeting: string;

    constructor(a?: BotConstructorParameters) {
        super();

        if (a) {
            this.id = a.id;
            this.checkpoint = a.checkPoint.getRef();
            this.appearance = a.appearance;
            this.pos = a.checkPoint.pos;
            this.name = a.checkPoint.notes.getValue(Bot.nameParameter);
            this.displayName = a.checkPoint.notes.getValue(Bot.displayNameParameter) || this.name;
            this.greeting = a.checkPoint.notes.getValue(Bot.greetingParameter) || Bot.defaultGreeting;
        }

        this.debugIdentityString = `Bot, Id = ${this.id}, Name = ${this.name}, DisplayName = ${this.displayName}`;
    }

    static revive(data: any): Bot {
        let botType = data.typeId;
        let constructor = Types.bots.getType(botType);
        let instance = new constructor();

        return instance.revive(data);
    }

    getIdentityString(): string {
        return this.debugIdentityString;
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        let botSource = source as Bot;
        copy.id = botSource.id;
        copy.checkpoint = botSource.checkpoint.copy(); 
        copy.appearance = botSource.appearance;
        copy.pos = botSource.pos.copy();
        copy.name = botSource.name;
        copy.displayName = botSource.displayName;
        copy.rotating = botSource.rotating;
        copy.destination = botSource.destination && botSource.destination.copy();

        // TODO: need to pass parameter if we are packing or reviving so we can invoke 
        // pack or revive here
        copy.currentAction = botSource.currentAction && BotAction.revive(botSource.currentAction);

        // TODO: serialize states
        copy.state = target.state;//.serialize();
        copy.availableStates = target.availableStates;//.map(s => s.serialize());

        return copy;
    }

    addAvailableState(state: BotState): void {
        this.availableStates.push(state);
    }

    activate(manager : BotManager) : void {
        if (this.active) {
            throw new FlyfoxError(`Cannot reactivate bot ${this.debugIdentityString}!`);
        }

        this.manager = manager;
        this.active = true;
        this.updateEvent();
    }

    deactivate(): void {
        if (!this.active) {
            throw new FlyfoxError(`Cannot deactivate bot cause it is not active! ${this.debugIdentityString}`);
        }

        this.active = false;
        this.updateEvent();
    }

    getMap(): Map {
        return World.instance.getMap(this.pos.mapId);
    }

    mapId() : number {
        return this.pos.mapId;
    }

    update(context : ActionContext) : void {
        this.updateEvent();

        if (!this.isBusy()) {
            this.updateState(context);
        }

        this.currentAction.update(context);
    }

    private updateState(context : ActionContext) : void {
        if (!this.state) {
            this.selectState();
        }

        let selectedAction = this.state.selectAction(context);
        this.currentAction = new selectedAction();
        this.currentAction.start();
    }

    selectState() : void {
        let context = new SelectStateContext();
        for (let potentialState of this.availableStates) {
            if (!potentialState.applicable(context)) {
                continue;
            }

            if (this.state && this.state != potentialState) {
                this.state.dispose();
            }

            this.state = potentialState;
            this.state.activate();
        }

        if (!this.state) {
            // fallback state
        }
    }

    isActive() : boolean {
        return this.active;
    }

    isVisible(): boolean {
        return this.mapId() == World.instance.currentMapId();
    }

    isBusy() : boolean {
        return this.currentAction && this.currentAction.isRunning();
    }

    initialPosition(): MapPosition {
        let map = World.instance.getMap(this.checkpoint.mapId);
        return map.points[this.checkpoint.checkpointId].pos;
    }

    atStartPosition() : boolean {
        let startPos = this.initialPosition();
        return startPos.equals(this.pos);
    }

    atPosition(pos: MapPosition): boolean {
        return pos.equals(this.pos);
    }

    setPosition(pos : {x : number, y : number, mapId? : number}) : void {
        let mapId = pos.mapId || this.pos.mapId;
        this.pos = MapPosition.create(pos, mapId);
    }

    /*crossMap(pos : MapPosition) {
        this.setPosition(pos);
        this.updateEvent();
    }*/

    queueMove(pos : {x : number, y : number, mapId? : number}) : void {
        let mapId = pos.mapId || this.pos.mapId;
        this.destination = MapPosition.create(pos, mapId);
    }

    turnTo(pos : LocalPosition) : void {
        let { x, y } = pos;

        let my = this.pos;
        if (x < my.x) {
            this.rotating = 1;
        }
        else if (y < my.y) {
            this.rotating = 2;
        }
        else if (x > my.x) {
            this.rotating = 3;
        }
        else if (y > my.y) {
            this.rotating = 4;
        }
    }

    turnDefault() : void {
        this.rotating = 4;
    }

    moveDone() : void {
        if (!this.destination) {
            return;
        }

        this.pos = this.destination;
        this.destination = null;
    }

    isMoving() : boolean {
        return !!this.destination;
    }

    isEventMoving() : boolean {
        return this.event && this.event.isMoving();
    }

    isRotating() : boolean {
        return !!this.rotating;
    }

    clearRotation() : void {
        this.rotating = null;
    }

    private updateEvent() : void {
        if (this.isVisible()) {
            if (!this.event) {
                this.spawnEvent();
            }
        }
        else {
            if (this.event) {
                this.event.disable();
            }
            this.clearEvent();
        }
    }

    private clearEvent() : void {
        this.event = null;
    }

    private spawnEvent(): void {
        this.event = BotEvent.spawn(this);// new BotEvent(this, this.appearance);
    }
}