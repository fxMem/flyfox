/**
 * Created by memo on 21.01.2017.
 */
class Welcoming {
    constructor(private quests: Quest[]) {

    }

    getChoices(): string[] {
        return null;
        //let lines = this.quests.map((d) => { return d.getCurrentLine() });
        //if (lines.some((l) => { return !(l instanceof TextLine); })) {
        //    throw new Error("Dialogue must be started with text line!");
        //}

        //return lines.map((l) => {
        //    if (l instanceof TextLine) {
        //        return l.text;
        //    }
        //});
    }

    getDialogForChoice(choiceId: number): Quest {
        return this.quests[choiceId];
    }
}