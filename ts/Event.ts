/**
 * Created by memo on 19.01.2017.
 */

class BotEvent extends Game_Event{
    private previousTurn: boolean;
    private eventIndex: number;

    private constructor(public bot: Bot, private appearance: BotAppearance, eventIndex: number) {
        super(bot.pos.mapId, eventIndex);
        this.eventIndex = eventIndex;

        this._defaultRoute = {
            list : [{
                code : 100
            }],
            repeat : true,
            skippable : false,
            wait : false
        };
        $gameMap._events[eventIndex] = this;

        this.initializeEvent(bot.pos, eventIndex);
        this._sprite = new Sprite_Character(this);
        SceneManager._scene._spriteset._tilemap.addChild(this._sprite);
    }

    static spawn(bot: Bot): BotEvent {
        let pos = bot.pos;
        let eventIndex = $dataMap.events.length;
        let dataEvent = this.createDataEvent(pos, eventIndex);
        $dataMap.events[eventIndex] = dataEvent;
        let event = new BotEvent(bot, bot.appearance, eventIndex);
        return event;
    }

    disable() : void {
        this._enabled = false;
        this.setImage("", 0);
        this.setPriorityType(2);

        this.removeEvent();
    }

    protected processMoveCommand(command : any) {
        this.doEventMoveCommand(command);

        if (command.code == 100) {
            this.invokeMove();
        }
    }

    private doEventMoveCommand(command : any) : void {
        if (command == Game_Character.ROUTE_TURN_RANDOM) {
            this.previousTurn = true;
        }
        else {
            this.previousTurn = false;
        }
        super.processMoveCommand(command);
    }


    private invokeMove() : void {
        if (!this._enabled) {
            return;
        }

        this.move();
    }

    private move() : void {
        if (this.bot.isRotating()) {
            this.rotate();
            return;
        }

        if (!this.bot.isMoving()) {
            return;
        }

        var nextPosition = this.bot.destination;
        var targetX = nextPosition.x;
        var targetY = nextPosition.y;
        if (this._x == targetX && this._y == targetY) {
            return;
        }

        var direction = this.getDirection(nextPosition);
        this.doEventMoveCommand({code: direction });
        this.bot.setPosition({
            x : this._x,
            y : this._y
        })
    }

    private rotate() : void {
        var rotation = this.getRotation();
        this.doEventMoveCommand({ code : rotation });
        this.bot.clearRotation();
    }

    private getRotation() : void {
        var rotation = this.bot.rotating;
        switch (rotation) {
            case 1 :
                return Game_Character.ROUTE_TURN_LEFT;
            case 2 :
                return Game_Character.ROUTE_TURN_UP;
            case 3 :
                return Game_Character.ROUTE_TURN_RIGHT;
            case 4 :
                return Game_Character.ROUTE_TURN_DOWN;
        }

        return Game_Character.ROUTE_WAIT;
    }

    private getDirection(next : MapPosition) : void {
        //this.bot.writeLog("Cur X = {0}, Cur Y = {1}, next.X = {2} , next.Y = {3}".f(currentX, currentY, next.x, next.y));
        var currentX = this._x;
        var currentY = this._y;
        var diffY = next.y - currentY;
        var diffX = next.x - currentX;



        if (diffY == 1) {
            return Game_Character.ROUTE_MOVE_DOWN;
        }
        else if(diffY == -1) {
            return Game_Character.ROUTE_MOVE_UP;
        }

        if (diffX == 1) {
            return Game_Character.ROUTE_MOVE_RIGHT;
        }
        else if (diffX == -1) {
            return Game_Character.ROUTE_MOVE_LEFT;
        }

        //this.bot.writeLog("Cur X = {0}, Cur Y = {1}, next.X = {2} , next.Y = {3} (Error!)".f(currentX, currentY, next.x, next.y));
        throw new Error("Cant find right direction!");
    }

    private removeEvent() : void {
        // maybe here we should search for changed index?
        $dataMap.events.splice(this.eventIndex, 1);
        $gameMap._events.splice(this.eventIndex, 1);

        SceneManager._scene._spriteset._tilemap.removeChild(this._sprite);
    }

    private initializeEvent(pos : MapPosition, eventId : number) : void {
        this.initialize(pos.mapId, eventId);
        this._enabled = true;
        this.locate(pos.x, pos.y);
        this.setImage(this.appearance.title, this.appearance.id);
        this.setMoveRoute(this._defaultRoute);
        this.setPriorityType(1);
    }

    private static createDataEvent(pos: MapPosition, index: number): any {
        return {
            pages: [{
                conditions: {
                    actorValid: false,
                    itemValid: false,
                    selfSwitchValid: false,
                    switch1Valid: false,
                    switch2Valid: false,
                    variableValid: false
                },
                image: {
                    characterIndex: 0,
                    characterName: "",
                    tileId: 0,
                    direction: 2,
                    pattern: 0
                },
                moveType: 3,
                priorityType: 1,
                walkAnime: true,
                through: true,
                stepAnime: false,
                moveSpeed: 3,
                moveFrequency: 5,
                directionFix: false,
                moveRoute: {
                    list: [{
                        code: 100
                    }],
                    repeat: true,
                    skippable: false,
                    wait: false
                },
                list: [
                    { code: -1, indent: 0, parameters: [] },
                    { code: 0, indent: 0, parameters: [] }
                ]
            }],
            id : index,
            x : pos.x,
            y : pos.y
        };
    }

}