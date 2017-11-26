/**
 * Created by memo on 21.01.2017.
 */
 
class QuestStage {
    id: number;
    dialogues: Dialogue[] = [];

    constructor(data: any) {
        this.id = data.id;
        this.dialogues = (data.dialogues as any[]).map((v) => new Dialogue(v));
    }

    getDialogueByBotName(botName: string): Dialogue {
        let result = this.dialogues.first(d => d.botName == botName);
        if (!result) {
            throw new FlyfoxError(`Dialogue with botId ${botName} do not exists!`);
        }

        return result;
    }

    getDialogue(dialogueId: number): Dialogue {
        let result = this.dialogues.first(d => d.id == dialogueId);
        if (!result) {
            throw new FlyfoxError(`Dialogue with id ${dialogueId} do not exists!`);
        }

        return result;
    }

    dialogueExistsByBotName(botName: string): boolean {
        return !!this.dialogues.first(d => d.botName == botName);
    }
}