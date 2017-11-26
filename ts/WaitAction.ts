/**
 * Created by memo on 28.01.2017.
 */
interface WaitParameters {
    duration?: number;
    turnAround?: boolean;
    mult?: number;
}

class WaitAction extends BotAction{
    private ticks : number;
    duration: number = 1;
    turnAround: boolean = false;
    mult: number = 60;

    constructor(a?: WaitParameters) {
        super();

        if (a) {
            this.duration = a.duration || this.duration;
            this.turnAround = a.turnAround || this.turnAround;
            this.mult = a.mult || this.mult;
        }
    }

    serialize(source: any, target: any): any {
        let copy = super.serialize(source, target);
        copy.ticks = source.ticks;
        copy.duration = source.duration;
        copy.turnAround = source.turnAround;
        copy.mult = source.mult;

        return copy;
    }

    protected onStart() : void {
        this.ticks = 0;
    }

    protected onFinish() : void {

    }
    protected onUpdate() : void {
        if (this.ticks  >= this.duration * this.mult) {
            this.finish();
        }
        else {
            this.ticks++;
            if (this.turnAround) {
                this.turn();
            }
        }
    }

    private turn() : void {

    }
}

Types.register(WaitAction);