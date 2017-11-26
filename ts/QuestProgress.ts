class DialogueRef {
    constructor(public blockId: number, public lineId: number) {

    }

    static fromBlockStart(blockId: number): DialogueRef {
        return new DialogueRef(blockId, null);
    }

    static fromStageStart(): DialogueRef {

        // null value for blockId or lineId means first block/line respectively
        return new DialogueRef(null, null);
    }
}

class QuestProgress {
    private questId: number;
    private gotoDialogueId: number;
    private gotoDialogueRef: DialogueRef;

    beenFinished: boolean;
    active: boolean;
    stageId: number;
    completedCount: number;
    checkpoints: Dictionary<DialogueRef> = {};
    positions: Dictionary<DialogueRef> = {};

    constructor(quest: Quest) {
        this.stageId = null;
        this.active = false;
        this.beenFinished = false;
        this.completedCount = 0;

        let firstStage = quest.getFirstStage();
        this.stageId = firstStage.id;
    }

    prepare(): void {
        this.positions = {};
    }

    startQuest(): void {
        if (this.active) {
            throw new FlyfoxError(`Cannot start quest ${this.questId} twice!`);
        }

        this.active = true;
    }

    finishQuest(): void {
        if (!this.active) {
            throw new FlyfoxError(`Cannot finish quest ${this.questId} cause it is not active!`);
        }

        this.active = false;
        this.beenFinished = true;
        this.completedCount++;
    }

    dialogueExists(quest: Quest, botName: string): boolean {
        let stage = quest.getStage(this.stageId);
        return stage.dialogueExistsByBotName(botName);
    }

    isActive(): boolean {
        return this.active;
    }

    setStage(stageId: number): void {
        this.checkQuestActive();

        this.stageId = stageId;
        this.checkpoints = {};
        this.positions = {};
    }

    setCheckpointAtCurrentPosition(dialogueId: number): void {
        let currentPosition = this.getPosition(dialogueId);
        this.setCheckpoint(dialogueId, currentPosition);
    }

    setCheckpointAtCurrentPositionEx(quest: Quest, bot: BotInfo): void {
        let dialogue = this.getDialogue(quest, bot.name);
        this.setCheckpointAtCurrentPosition(dialogue.id);
    }

    setCheckpoint(dialogueId: number, checkpoint: DialogueRef): void {
        this.checkpoints[dialogueId] = checkpoint;
    }

    setupGotoEx(quest: Quest, bot: BotInfo, position: DialogueRef): void {
        // This method schedules goto move (for GotoLine line)

        let dialogue = this.getDialogue(quest, bot.name);
        this.setupGoto(dialogue.id, position);
    }

    setupGoto(dialogueId: number, position: DialogueRef): void {
        // This method schedules goto move (for GotoLine line)

        this.gotoDialogueId = dialogueId;
        this.gotoDialogueRef = position;
    }

    getPosition(dialogueId: number): DialogueRef {
        let result = this.positions[dialogueId] || this.getCheckpoint(dialogueId);
        if (!result) {
            result = DialogueRef.fromStageStart();
            this.setPosition(dialogueId, result);
        }

        return result;
    }

    moveToNextLine(quest: Quest, botName: string): Line {
        if (this.gotoDialogueId != null) {
            this.setPosition(this.gotoDialogueId, this.gotoDialogueRef);

            this.gotoDialogueId = null;
            this.gotoDialogueRef = null;
            return this.getLine(quest, botName);
        }

        let dialogue = this.getDialogue(quest, botName);
        let position = this.getPosition(dialogue.id);
        let block = dialogue.getBlock(position.blockId);
        let nextLine = block.getNextLine(position.lineId);

        this.setPosition(dialogue.id, new DialogueRef(block.id, nextLine.id));
        return nextLine;
    }

    getLine(quest: Quest, botName: string): Line {
        let dialogue = this.getDialogue(quest, botName);
        let position = this.getPosition(dialogue.id);
        let block = dialogue.getBlock(position.blockId);
        return block.getLine(position.lineId);
    }

    tryGetFirstText(quest: Quest, botName: string): MultiText {
        let nextLine = this.getLine(quest, botName);
        if (nextLine instanceof CheckpointLine) {
            nextLine = this.moveToNextLine(quest, botName);
        }

        if (!(nextLine instanceof TextLine)) {
            throw new FlyfoxError(`Checkpoint for quest ${quest.id}, botName = ${botName} is not started with text line!`);
        }

        return nextLine.text;
    }

    dispose(): void {
        this.positions = {};
    }

    private getCheckpoint(dialogueId: number): DialogueRef {
        return this.checkpoints[dialogueId];
    } 

    private setPositionEx(quest: Quest, bot: BotInfo, position: DialogueRef): void {
        let dialogue = this.getDialogue(quest, bot.name);
        this.setPosition(dialogue.id, position);
    }

    private setPosition(dialogueId: number, position: DialogueRef): void {
        this.positions[dialogueId] = position;
    }

    private checkQuestActive(): void {
        if (!this.active) {
            throw new FlyfoxError(`Cannot get information from quest ${this.questId} cause quest is not active!`);
        }
    }

    private getDialogue(quest: Quest, botName: string): Dialogue {
        let stage = quest.getStage(this.stageId);
        return stage.getDialogueByBotName(botName);
    }

    //private getCurrentBlock(quest: Quest, botName: string): DialogueBlock {
    //    let dialogue = this.getDialogue(quest, botName);
    //    let ref = this.getPosition(dialogue.id);
    //    if (!ref) {
    //        ref = DialogueRef.fromStageStart();
    //    }

    //    return dialogue.getBlock(ref.blockId);
    //}
}

class GlobalProgress {
    private quests: Dictionary<QuestProgress> = {};

    constructor(data: any) {
        if (data) {
            this.quests = data.quests;
        }
    }

    getProgress(quest: Quest): QuestProgress {
        let questProgress = this.quests[quest.id];
        if (!questProgress) {
            questProgress = new QuestProgress(quest);
            this.quests[quest.id] = questProgress;
        }

        return questProgress;
    }

    isQuestActive(questId: number): boolean {
        let questInfo = this.quests[questId];
        return (questInfo && questInfo.active) || false;
    }

    getQuestCompletionCount(questId: number): number {
        let questInfo = this.quests[questId];
        return (questInfo && questInfo.completedCount) || 0;
    }

    //getCurrentStage(questId: number): number {
    //    let questInfo = this.quests[questId];
    //    return (questInfo && questInfo.stageId) || 0;
    //}

    //getDialogueCheckpoint(questId: number, botId: number): DialogueRef {
    //    let questInfo = this.quests[questId];
    //    if (!questInfo) {
    //        return null;
    //    }

    //    return questInfo.checkpoints[botId] || null;
    //}
}