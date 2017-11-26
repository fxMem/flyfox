/**
 * Created by memo on 28.01.2017.
 */
/*class BotStateBuilder<T extends BotStateConstructor> {
    private stateConstructor : BotStateConstructor;
    private instance : BotState;

    constructor(stateType : BotStateConstructor, parameters : any) {
        this.stateConstructor = stateType;
        this.instance = new this.stateConstructor(parameters);
    }

    addAction(a : BotActionConstructor) {
        this.instance.addAction(a);
        return this;
    }

    build() : BotState {
        return this.instance;
    }
}*/

class PeriodBuilder {
    instance: TimeBotState;
    constructor(private source: TimeBotStateBuilder, interval : DayInterval) {
        this.instance = new TimeBotState(interval);
    }

    addAction(a : BotActionConstructor) {
        this.instance.addAction(a);
        return this;
    }

    closePeriod() : TimeBotStateBuilder {
        return this.source;
    }

    createPeriod(startHour : number, endHour : number) : PeriodBuilder {
        return this.source.createPeriod(startHour, endHour);
    }

    build() : BotState {
        return this.source.build();
    }
}

class TimeBotStateBuilder {
    private instance : CompositeTimeBotState;
    constructor() {
        this.instance = new CompositeTimeBotState(new DayInterval(0, 24));
    }

    createPeriod(startHour: number, endHour: number): PeriodBuilder {
        let period = new PeriodBuilder(this, new DayInterval(startHour, endHour));
        this.instance.addPeriod(period.instance);
        return period;
    }

    build() : BotState {
        return this.instance;
    }
}