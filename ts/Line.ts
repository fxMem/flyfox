class Line {
    id: number;

    constructor(data: any) {
        this.id = data.Id;
    }

    shown(context: LineContext): void {
        context.setCurrentLine(this);
    }

    static create(data: any): Line {
        var lineType = data.$type;
        switch (lineType) {
            case "Flyfox.QuestEditor.Editor.TextLine":
                return new TextLine(data);
            case "Flyfox.QuestEditor.Editor.ChoiceLine":
                return new ChoiceLine(data);
            case "Flyfox.QuestEditor.Editor.GotoStageLine":
                return new GotoStageLine(data);
            case "Flyfox.QuestEditor.Editor.GotoLine":
                return new GotoBlockLine(data);
            case "Flyfox.QuestEditor.Editor.FinishQuestLine":
                return new FinishQuestLine(data);
            case "Flyfox.QuestEditor.Editor.HideTextLine":
                return new HideTextLine(data);
            case "Flyfox.QuestEditor.Editor.CheckpointLine":
                return new CheckpointLine(data);
        }

        throw new FlyfoxError(`Cannot find correct line type! ${lineType}`);
    }
}

class TextLine extends Line {
    text: MultiText;

    constructor(data: any) {
        super(data);

        this.text = new MultiText(data.Text);
    }

    shown(context: LineContext): void {
        super.shown(context);
        context.setText(this.text);
    }

    
}

class ChoiceLine extends Line {
    choices: GotoBlockLine[];
    text: MultiText;

    constructor(data: any) {
        super(data);  

        this.choices = (data.Choices as any[]).map(c => new GotoBlockLine(c));
        this.text = new MultiText(data.Text);
    }

    shown(context: LineContext): void  {
        super.shown(context);

        let choices = this.choices.map(c => c.text);
        context.setChoices(choices);
        context.setText(this.text);
    }
}

class GotoStageLine extends Line {
    stageId: number;

    constructor(data: any) {
        super(data);

        this.stageId = data.StageId;
    }

    shown(context: LineContext): void {
        super.shown(context);

        context.setStage(this.stageId);
        context.setBreak();
    }
}

class GotoBlockLine extends Line {
    blockId: number;
    text: MultiText;

    constructor(data: any) {
        super(data);

        this.blockId = data.TargetBlockId;
        this.text = new MultiText(data.Text);
    }

    shown(context: LineContext): void {
        super.shown(context);
        context.moveToBlock(this.blockId);
    }
}

class FinishQuestLine extends Line {
    constructor(data: any) {
        super(data);
    }

    shown(context: LineContext): void {
        context.questFinished();
    }
}

class HideTextLine extends Line {
    constructor(data: any) {
        super(data);
    }

    shown(context: LineContext): void {
        context.setBreak();
    }
}

class CheckpointLine extends Line {
    constructor(data: any) {
        super(data);
    }

    shown(context: LineContext): void {
        context.setCheckpoint();
    }
}