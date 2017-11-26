/**
 * Created by memo on 21.01.2017.
 */
class DialogueBlock {
    id: number;
    lines: Line[] = [];

    constructor(data: any) {
        this.id = data.id;
        this.lines = (data.lines as any[]).map((v) => Line.create(v));
    }

    getLine(lineId: number): Line {
        if (lineId == null) {
            if (!this.lines.length) {
                throw new FlyfoxError(`Empty block ${this.id}`);
            }

            return this.lines[0];
        }
        else {
            let result = this.lines.first(l => l.id === lineId);
            if (!result) {
                throw new FlyfoxError(`Current line with lineId ${lineId} do not exists!`);
            }

            return result;
        }
    }

    getNextLine(lineId: number): Line {
        if (lineId == null) {
            if (this.lines.length < 2) {
                throw new FlyfoxError(`Block ${this.id} doesnt have enough lines to move on!`);
            }

            return this.lines[1];
        }

        let index: number = -1;
        for (let i = 0; i < this.lines.length; i++) {
            let next = this.lines[i];
            if (next.id == lineId) {
                index = i;
                break;
            }
        }

        if (index == -1) {
            throw new FlyfoxError(`Line with id ${lineId} not found in block ${this.id}`);
        }

        if (index == this.lines.length - 1) {
            throw new FlyfoxError(`Cannot move forvard from line ${lineId}, block ${this.id}. Is it not completed block?`);
        }

        index++;
        return this.lines[index];
    }
}