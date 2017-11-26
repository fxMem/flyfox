/**
 * Created by memo on 21.01.2017.
 */
 
class QuestManager {
    private quests: Quest[];
    private questsMap: Dictionary<Quest> = {};
    private references: BotReference[];
    private referencesMap: Dictionary<BotReference> = {};
    private processor: QuestProcessor;
    private previousCommandIndex: number = null;

    private currentEventId: number;
    private currentMapId: number;

    progress: GlobalProgress;
    dataBag: QuestDataBag;

    constructor(dialogueData: any, private staticBotSource: StaticBotsSource, private log: Log) {
        this.progress = new GlobalProgress(null);
        this.loadData(dialogueData);
        this.initialize();
    }

    getBotReference(botName: string): BotReference {
        let ref = this.referencesMap[botName];
        if (!ref) {
            throw new FlyfoxError(`Reference for bot ${botName} is not found!`);
        }

        return ref;
    }

    setProgress(data: any): void { 
        this.progress = new GlobalProgress(data);
    }
     
    getQuestsForBot(botName: string): number[]  {
        let ref = this.referencesMap[botName];
        return ref && ref.questIds;
    }

    getQuest(questId: number): Quest {
        return this.questsMap[questId];
    }

    private loadData(data: any): void {
        this.quests = (data.quests as any[]).map(q => new Quest(q));
        this.references = (data.references as any[]).map(r => new BotReference(r));
        this.dataBag = new QuestDataBag(data);

        for (let ref of this.references) {
            this.referencesMap[ref.botName] = ref;
        }

        for (let q of this.quests) {
            this.questsMap[q.id] = q;
        }
    }

    private initialize(): void {
        this.log.verbose("Initialize Flyfox.Quests...");

        let Game_Interpreter_executeCommand = Game_Interpreter.prototype.executeCommand;
        let Game_Message_onChoice = Game_Message.prototype.onChoice;
        let Game_Message_clear = Game_Message.prototype.clear;
        let Game_Interpreter_currentCommand = Game_Interpreter.prototype.currentCommand;
        let Game_Interpreter_nextEventCode = Game_Interpreter.prototype.nextEventCode;
        let Game_Event_start = Game_Event.prototype.start;

        let that = this;
        // In some places here "run" function is used instead of "wrap".
        // It is because those functions return some value and its easier that way.
        Game_Event.prototype.start = function () {
            let eventId = this._eventId;
            let mapId = this._mapId;
            if (that.isFlyfoxEvent(eventId)) {
                run(() => {
                    // copy-paste from rpg_objects.js 8555 line
                    that.setCurrentEvent(eventId, mapId);
                    this._starting = true;
                    if (this.isTriggerIn([0, 1, 2])) {
                        this.lock();
                    }
                });
            }
            else {
                Game_Event_start.call(this);
            }
        };

        Game_Interpreter.prototype.currentCommand = function () {
            let eventId = this._eventId;
            let mapId = World.instance.currentMapId();

            if (that.isFlyfoxEvent(eventId) && that.isCurrentEventRunning(eventId, mapId)) {
                let result: RPGMakerCommand;
                run(() => {
                    if (that.previousCommandIndex === null) {
                        result = that.buildCommand(eventId);
                    }
                    else {
                        let moveForward = that.previousCommandIndex < this._index;
                        result = that.buildCommand(eventId, moveForward);
                    }

                    that.previousCommandIndex = this._index;

                    if (result.code == 0) {
                        // exit

                        that.disposeQuest();
                        result = null;
                    }
                });

                return result;
            } 
            else {
                return Game_Interpreter_currentCommand.call(this);
            }
        };

        Game_Interpreter.prototype.nextEventCode = function () {
            let eventId = this._eventId;
            let mapId = World.instance.currentMapId();

            if (that.isFlyfoxEvent(eventId) && that.isCurrentEventRunning(eventId, mapId)) {
                let nextEventCode: number;

                run(() => {
                    nextEventCode = that.getNextCode();
                });

                return nextEventCode;
            }
            else {
                return Game_Interpreter_nextEventCode.call(this);
            }
        };

        Game_Message.prototype.onChoice = function (n) {
            run(() => { that.choiceSelected(n); });
            Game_Message_onChoice.call(this, n);
        };
    }

    private initializeQuest(bot: BotInfo): void {
        if (!this.processor) {
            this.log.verbose(`Initializing quest for bot [${bot.getIdentityString()}]`);
            this.processor = new QuestProcessor(this, this.progress, bot, this.log);
        }
    }

    private disposeQuest(): void {
        this.log.verbose(`Shutting current session down`);
        this.processor.dispose();
        this.processor = null;
        this.previousCommandIndex = null;
        this.clearCurrentIds();
    }

    private getNextCode(): number {
        if (this.processor) {
            return this.processor.getNextId();
        }
        else {
            return QuestProcessor.startingCodeId;
        }
    }

    private clearCurrentIds(): void {
        this.currentEventId = null;
        this.currentMapId = null;
    }

    private isCurrentEventRunning(eventId: number, mapId: number): boolean {
        return this.currentEventId == eventId && this.currentMapId == mapId;
    }

    private setCurrentEvent(eventId: number, mapId: number): void {
        this.currentEventId = eventId;
        this.currentMapId = mapId;
    }

    private isFlyfoxEvent(eventId: number): boolean {
        let event = this.getEvent(eventId);
        if (event && event instanceof BotEvent) {
            return true;
        }
        
        return this.isStaticBot(eventId);
    }

    private isStaticBot(eventId: number): boolean {
        let notes = this.getNotes(eventId);
        return notes && notes.isStaticBot();
    }

    private getNotes(eventId: number): NoteParameters {
        let dataEvent = this.getDataEvent(eventId);
        if (!dataEvent || !dataEvent.note) {
            return null;
        }

        let notes = NoteParameters.create(dataEvent.note as string);
        return notes;
    }

    private getEvent(eventId: number): any {
        return $gameMap._events[eventId];
    }

    private getDataEvent(eventId: number): any {
        return $dataMap.events[eventId];
    }

    private choiceSelected(choiceIndex: number): void {
        // Right now this will be called every time choice is made.
        // Not null processor is how we know that its flyfox bot being processed.
        if (this.processor) {
            if (choiceIndex === undefined) {

                // Player pressed ESC instead of making choice. Exitting...
                this.disposeQuest();
            }
            else {
                this.processor.selectChoice(choiceIndex);
            }
            
        }
    }

    private buildCommand(eventId: number, moveNext: boolean = true): any {
        let bot = this.getBotInfo(eventId);
        if (!bot) {
            throw new FlyfoxError(`BotInformation now found for event with id ${eventId}!`);
        }

        this.initializeQuest(bot);

        if (moveNext) {
            return this.moveNext();
        }
        else {
            return this.getCurrent();
        }
    }

    private moveNext(): RPGMakerCommand {
        return this.processor.getNextAndMove();
    }

    private getCurrent(): RPGMakerCommand {
        return this.processor.getCurrent();
    }

    private getBotInfo(eventId: number): BotInfo {
        let event = this.getEvent(eventId);
        if (!event) {
            throw new FlyfoxError(`Event with id ${eventId} is not found!`);
        }

        if (event instanceof BotEvent) {
            return event.bot;
        } 

        let notes = this.getNotes(eventId);
        if (!notes) {
            throw new FlyfoxError(`Event with id ${eventId} should have note cause it's defined as StaticBot!`);
        }

        let genericBot = this.getDataEvent(eventId);
        let name = notes.getValue(Bot.nameParameter);
        //let displayName = notes.getValue(Bot.displayNameParameter) || name;
        //let greeting = notes.getValue(Bot.greetingParameter) || Bot.defaultGreeting;
        //return new StaticBotRef(-1, name, displayName, greeting);

        //let notes = NoteParameters.create(event.note as string);
        
        return this.staticBotSource.getStaticBotByName(name);
    }
}