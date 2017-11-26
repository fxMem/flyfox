class QuestProcessor {
    private welcomingQuests: Quest[];
    private currentQuest: Quest;
    private player: QuestPlayer = null;
    private currentQuestProgress: QuestProgress;
    private currentCommand: RPGMakerCompositeCommand = null;
    private botReference: BotReference;

    static startingCodeId = RPGMakerCommand.blockBeginningCommandId;

    constructor(private manager: QuestManager, private progress: GlobalProgress, private bot: BotInfo, private log: Log) {
        this.botReference = manager.getBotReference(bot.name);
    }

    getNextAndMove(): RPGMakerCommand {
        if (this.currentCommand && !this.currentCommand.isCompleted()) {
            return this.currentCommand.getNextCommandAndMove();
        }

        let info: DisplayInfo;
        if (this.isWelcoming()) {
            this.welcomingQuests = this.getAvailableQuests();
            let welcomeLines = this.getWelcomeLines();

            // if there is more than one quest, associated with this bot, 
            // assemble "Welcoming" selection. Otherwise, just go on with 
            // single availavle quest
            if (welcomeLines.length == 0) {

                // this will exit dialog
                info = new DisplayInfo();
            }
            else if (welcomeLines.length == 1) {
                let line = welcomeLines[0];
                info = new DisplayInfo(line);

                this.selectQuest(this.welcomingQuests[0]);
            }
            else {
                let welcomeText = this.botReference.greeting.getText(this.manager.dataBag.language);
                info = new DisplayInfo(welcomeText, welcomeLines);
            }

            this.logVerbose(`Bot welcome. Quests count: ${this.welcomingQuests.length}, ids = [${this.welcomingQuests.map(q => q.id).toString()}]`);
        }
        else {
            info = this.player.moveNext();
            this.logVerbose(`Moving quest next.`);
        }

        this.logVerbose(`Displayed: ${info.toString()}`);
        return this.returnCommand(info);
    }

    getCurrent(): RPGMakerCommand {
        if (!this.currentCommand) {
            throw new FlyfoxError("Cannot get current command from QuestProcessor: invoke getNextAndMove first")
        }

        let result = this.currentCommand.getCurrentCommand();
        this.logVerbose(`Returning current command (${result.code})`);
        return result;
    }

    getNextId(): number {
        //TODO: if here is a null?
        let result = this.currentCommand.getNextCode();
        this.logVerbose(`Returning next command id = ${result}`);

        return result;
    }

    selectChoice(index: number): void {
        if (this.isWelcoming()) {
            if (this.welcomingQuests.length <= index || index < 0) {
                throw new FlyfoxError(`Cannot find welcoming quest for selected line index ${index}`);
            }

            this.selectQuest(this.welcomingQuests[index]);
            this.logVerbose(`Selected welcome choice (${index}), quest id = ${this.currentQuest.id}`);
        }
        else {
            this.player.selectChoice(index);
        }
    }

    dispose(): void {
        if (this.currentQuestProgress) {
            this.currentQuestProgress.dispose();
        }
    }

    private returnCommand(input: DisplayInfo): RPGMakerCommand {
        if (!this.currentCommandCompleted()) {
            throw new FlyfoxError("Cannot initialize next command cause current one is not yet completed!");
        }

        this.currentCommand = RPGMakerCompositeCommand.createFromDisplayInfo(input);
        return this.currentCommand.getNextCommandAndMove();
    }

    private currentCommandCompleted(): boolean {
        return !(this.currentCommand && !this.currentCommand.isCompleted())
    }

    private selectQuest(quest: Quest): void {
        this.currentQuest = quest;
        this.currentQuestProgress = this.progress.getProgress(this.currentQuest);

        // TODO: think about it. Clearing temp progress at start causes a bug with 
        // Checkpoints (duplicate text). Can this be safely removed?
        // this.currentQuestProgress.prepare();

        this.player = new QuestPlayer(this.manager.dataBag, this.currentQuestProgress, this.currentQuest, this.bot);

        if (!this.currentQuestProgress.isActive()) {
            this.currentQuestProgress.startQuest();
        }
    }

    private getWelcomeLines(): string[] {
        let result: string[] = [];
        for (let q of this.welcomingQuests) {
            let progeress = this.progress.getProgress(q);
            let text = progeress.tryGetFirstText(q, this.bot.name);
            result.push(text.getText(this.manager.dataBag.language));
        }

        return result;
    }

    private getAvailableQuests(): Quest[] {
        let progress = this.progress;
        let questIds = this.manager.getQuestsForBot(this.bot.name);
        if (!questIds) {
            return [];
        }

        let result: Quest[] = [];
        for (let questId of questIds) {
            let quest = this.manager.getQuest(questId);
            if (quest.available(Player.get(), progress, this.bot.name)) {
                result.push(quest);
            }
        }

        return result;
    }

    private isWelcoming(): boolean {
        return !this.player;
    }

    private logVerbose(message: string): void {
        this.log.verbose(message);
    }
}