/**
 * Created by memo on 21.01.2017.
 */
abstract class Condition {

    constructor(data: any) {

    }

    abstract check(player: PlayerWrapper, progress: GlobalProgress): boolean;

    static create(data: any): Condition {
        if (!data) {
            return new EmptyCondition(null);
        }

        var conditionType = data.$type;
        switch (conditionType) {
            case "Flyfox.QuestEditor.Editor.VariableCondition":
                return new VariableCondition(data);
        }

        throw new FlyfoxError(`Cannot find correct condition type! ${conditionType}`);
    }
}

class EmptyCondition extends Condition {
    check(player: PlayerWrapper, progress: GlobalProgress): boolean {
        return true;
    }
}

class VariableCondition extends Condition {
    name: string;
    value: string;

    constructor(data: any) {
        super(data);

        this.name = data.Name;
        this.value = data.Value;
    }

    check(player: PlayerWrapper, progress: GlobalProgress): boolean {
        return true;
    }
}