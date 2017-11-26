class LineContext {
    private break: boolean;

    text: string;
    choices: string[];
    currentLine: Line;

    constructor(private data: QuestDataBag, private quest: Quest, private bot: BotInfo, private progress: QuestProgress) {

    }

    // Should be called by specific line instance before attempting call other methods
    setCurrentLine(line: Line): void {
        this.currentLine = line;
    }

    setText(text: MultiText): void {
        this.text = text.getText(this.data.language);
    }

    getCurrentLanguage(): LanguageInfo {
        return this.data.language;
    }

    setChoices(choices: MultiText[]): void {
        this.choices = choices.map(c => c.getText(this.data.language));
    }

    setBreak(): void {
        this.break = true;
    }

    setCheckpoint() {
        this.progress.setCheckpointAtCurrentPositionEx(this.quest, this.bot);
    }

    setStage(stageId: number): void {
        this.progress.setStage(stageId);
        this.setBreak();
    }

    moveToBlock(blockId: number) {
        this.progress.setupGotoEx(this.quest, this.bot, DialogueRef.fromBlockStart(blockId));
    }

    displaySet(): boolean {
        return !!this.text || !!this.choices;
    }

    clearDisplay(): void {
        this.text = null;
        this.choices = null;
    }

    questFinished(): void {
        this.progress.finishQuest();
    }

    isFinished(): boolean {
        return !this.progress.isActive();
    }

    isBreak(): boolean {
        return this.break;
    }
}

class DisplayInfo {
    exit: boolean;
    text: string;
    choices: string[];

    constructor(text?: string, choices?: string[]) {
        this.text = text;
        this.choices = choices;

        if (!text && !choices) {
            this.exit = true;
        }
    }

    haveChoice(): boolean {
        return !!this.choices;
    }

    toString(): string {
        if (this.exit) {
            return "[exit]";
        }
        else {
            return `[${this.text}], select: [${this.choices || '...'}]`;
        }
    }

    static createFromContext(context: LineContext): DisplayInfo {
        return new DisplayInfo(context.text, context.choices);
    }

    static createWelcoming(context: Quest[]): DisplayInfo {
        return null;
    }
}

class QuestPlayer {
    private previousLineId: number = null;
    private botName: string;
    private context: LineContext;
    private display: DisplayInfo;

    constructor(private questData: QuestDataBag, private progress: QuestProgress, private quest: Quest, private bot: BotInfo) {
        this.context = new LineContext(this.questData, quest, bot, progress);
        this.botName = this.bot.name;
    }

    moveNext(): DisplayInfo {
        this.prepareContext();
        this.moveForward();
        return this.display;
    }

    selectChoice(choiceIndex: number): void {
        this.prepareContext();
        let currentLine = this.context.currentLine;
        if (!currentLine || !(currentLine instanceof ChoiceLine)) {
            throw new FlyfoxError(`Current line is not set or it's not ChoiceLine although it should be.`)
        }
        else {
            let selectedChoice = currentLine.choices[choiceIndex];
            if (selectedChoice) {
                // if selected choice is null, it may be that player pressed ESC 
                // button
                selectedChoice.shown(this.context);
            }
            
        }
    }

    private prepareContext(): void {
        this.context.clearDisplay();
    }

    private moveForward(): void {
        while (this.canMove()) {

            let nextLine = this.walk();
            nextLine.shown(this.context);
        }

        this.display = DisplayInfo.createFromContext(this.context);
    }

    private canMove(): boolean {
        return !this.context.displaySet() && !this.stopped();
    }

    private stopped(): boolean {
        return this.context.isFinished() || this.context.isBreak();
    }

    private walk(): Line {
        return this.progress.moveToNextLine(this.quest, this.botName);
    }

    private getCurrentLine(): Line {
        return this.progress.getLine(this.quest, this.botName);
    }

}