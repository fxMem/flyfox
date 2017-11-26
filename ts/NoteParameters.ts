/**
 * Created by memo on 20.01.2017.
 */
class NoteParameters {
    static create(raw : string) : NoteParameters {
        let params = raw.split(";");
        if (params[0] !== "flyfox") {
            return new NoteParameters({});
        }

        params.splice(0, 1);
        var res = {};
        params.forEach((p) => {
            let values = p.split("=");
            if (values.length == 1) {
                res[values[0]] = values[0];
            }
            else if (values.length == 2) {
                res[values[0]] = values[1];
            }
            else {
                throw new Error("Invalid flyfox event parameters!");
            }
        });

        return new NoteParameters(res);
    }

    constructor(private params: Dictionary<string>) {
        this.params = params;
    }

    isStaticBot(): boolean {
        return this.valueExists("bot");
    } 

    getValue(key : string) : string {
        return this.params[key];
    }

    valueExists(key : string) : boolean {
        return this.params[key] != null;
    }
}