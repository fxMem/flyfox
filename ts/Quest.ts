class Quest {
    id: number;
    title: string;
    condition: Condition;
    stages: QuestStage[] = [];

    constructor(data: any) {
        this.id = data.id;
        this.title = data.title;
        this.stages = (data.stages as any[]).map((v) => { return new QuestStage(v); });
        this.condition = Condition.create(data.condition);
    }

    available(player: PlayerWrapper, progress: GlobalProgress, botId: string): boolean {
        let questProgress = progress.getProgress(this);
        if (questProgress.beenFinished) {
            return false;
        }

        if (!questProgress.dialogueExists(this, botId)) {
            return false;
        }

        if (!this.condition) {
            return true;
        }

        return this.condition.check(player, progress);
    }

    getFirstStage(): QuestStage {
        return this.stages[0];
    }

    getStage(stageId: number): QuestStage {
        let result = this.stages.first(s => s.id == stageId);
        if (!result) {
            throw new FlyfoxError(`Stage with id ${stageId} do not exists!`);
        }

        return result;
    }
}

class BotReference {
    botName: string;
    greeting: MultiText;
    questIds: number[];

    constructor(data: any) {
        this.botName = data.botName;
        this.questIds = data.questIds;
        this.greeting = new MultiText(data.defaultGreeting);
    }
}