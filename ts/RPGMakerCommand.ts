/**
 * Created by memo on 21.01.2017.
 */
 
class RPGMakerCommand {
    static choiceCommandId = 102;
    static textCommandId = 401;
    static blockBeginningCommandId = 101;
    static exitCommandId = 0;
    parameters: any[] = [];
    indent: number = 0;

    constructor(public code: number) {

    }

    isChoice(): boolean {
        return this.code == RPGMakerCommand.choiceCommandId;
    }

    static createBlockBeginning(): RPGMakerCommand {
        let command = new RPGMakerCommand(RPGMakerCommand.blockBeginningCommandId);
        command.parameters.push("");
        command.parameters.push(0);
        command.parameters.push(0);
        command.parameters.push(2);
        return command;
    }

    static createShowText(text: string): RPGMakerCommand {
        let command = new RPGMakerCommand(RPGMakerCommand.textCommandId);
        command.parameters.push(text);
        return command;
    }

    static createChoices(texts: string[]): RPGMakerCommand {
        let command = new RPGMakerCommand(RPGMakerCommand.choiceCommandId);
        command.parameters.push(texts);
        return command;
    }

    static createExit(): RPGMakerCommand {
        let command = new RPGMakerCommand(RPGMakerCommand.exitCommandId);
        return command;
    }

    //static createFromDisplayInfo(info: DisplayInfo): RPGMakerCommand {
    //    if (info.text) {
    //        return RPGMakerCommand.createShowText(info.text);
    //    }
    //    else if (info.choices) {
    //        return RPGMakerCommand.createChoices(info.choices);
    //    }
    //    else {
    //        throw new FlyfoxError("Display info is empty!");
    //    }
    //}
}

class RPGMakerCompositeCommand {
    private commands: RPGMakerCommand[] = [];
    private currentCommandIndex = 0;

    static createChoice(text: string, choices: string[]): RPGMakerCompositeCommand {
        let command = new RPGMakerCompositeCommand();
        command.commands.push(RPGMakerCommand.createBlockBeginning());
        command.commands.push(RPGMakerCommand.createShowText(text));
        command.commands.push(RPGMakerCommand.createChoices(choices));

        return command;
    }

    static createText(text: string): RPGMakerCompositeCommand {
        let command = new RPGMakerCompositeCommand();
        command.commands.push(RPGMakerCommand.createBlockBeginning());
        command.commands.push(RPGMakerCommand.createShowText(text));
        return command;
    }

    static createExit(): RPGMakerCompositeCommand {
        let command = new RPGMakerCompositeCommand();
        command.commands.push(RPGMakerCommand.createExit());
        return command;
    }

    static createFromDisplayInfo(info: DisplayInfo): RPGMakerCompositeCommand {
        if (!info.text && !info.choices && !info.exit) {
            throw new FlyfoxError("Display info is empty!");
        }

        let command = new RPGMakerCompositeCommand();
        if (info.exit) {
            return RPGMakerCompositeCommand.createExit();
        }
        else if (info.choices) {
            return RPGMakerCompositeCommand.createChoice(info.text, info.choices);
        }
        else {
            return RPGMakerCompositeCommand.createText(info.text);
        }
    }

    isCompleted(): boolean {
        return this.currentCommandIndex == this.commands.length;
    }

    getCurrentCommand(): RPGMakerCommand {
        if (this.currentCommandIndex == 0) {
            throw new FlyfoxError("Cannot get current command: invoke getNextCommand first!");
        }

        return this.commands[this.currentCommandIndex - 1];
    }

    getNextCommand(): RPGMakerCommand {
        if (this.isCompleted()) {
            return null;
        }

        return this.commands[this.currentCommandIndex];
    }

    getNextCommandAndMove(): RPGMakerCommand {
        let nextCommand = this.getNextCommand();
        this.currentCommandIndex++;
        return nextCommand;
    }

    getNextCode(): number {
        if (this.isCompleted()) {
            return 0;
        }

        return this.getNextCommand().code;
    }


}