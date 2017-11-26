/**
 * Created by memo on 22.01.2017.
 */
class DayInterval {
    direct : boolean;
    constructor(public startHour : number, public endHour : number) {
        if (!this.isValid(this.startHour) || !this.isValid(this.endHour)) {
            throw new Error("Incorrect interval value");
        }

        this.direct = this.endHour >= this.startHour;
    }

    contains(a: DateTime) : boolean {
        let hour = a.hour();
        if (this.endHour >= this.startHour) {
            return ((this.startHour <= hour) && (hour <= this.endHour));
        }
        else {
            return ((0 <= hour) && (hour <= this.endHour)) || ((this.startHour <= hour) && (hour <= 24));
        }
    }

    intersects(a : DayInterval) : boolean {
        if (this.direct && a.direct) {
            return this.startHour < a.endHour && this.endHour > a.startHour;
        }
        else if (!this.direct && !a.direct) {
            return this.startHour > a.endHour && this.endHour < a.startHour;
        }
        else {
            let direct : DayInterval = this;
            let reverse = a;
            if (!this.direct) {
                direct = a;
                reverse = this;
            }

            return reverse.startHour < direct.endHour || reverse.endHour > direct.startHour;
        }
    }

    private isValid(a : number) : boolean {
        return 0 <= a && a <= 24;
    }
}

class DateTime {
    private hourUpdatesCallbacks : Action[];
    private dayUpdatesCallbacks : Action[];
    private realSecondsUpdatesCallbacks : Action[];

    private secPerHour = 3600;
    private secPerDay = 24 * this.secPerHour;
    private secPerMonth = this.secPerDay * 31;
    private secPerYear = this.secPerMonth * 12;
    private startYear = 0;
    private startMonth = 0;
    private startDay = 0;

    constructor(public seconds : number) {

    }

    year() : number {
        return Math.floor(this.seconds / this.secPerYear);
    }

    month() : number {
        return Math.floor((this.seconds % this.secPerYear) / this.secPerMonth)
    }

    day() : number {
        return Math.floor((this.seconds % this.secPerMonth) / this.secPerDay)
    }

    hour() : number {
        return Math.floor((this.seconds % this.secPerDay) / this.secPerHour);
    }

    subscribeForHourUpdates(callback : Action) : void {
        this.hourUpdatesCallbacks = this.hourUpdatesCallbacks || [];
        this.hourUpdatesCallbacks.push(callback);
    }

    subscribeForDayUpdates(callback : Action) : void {
        this.dayUpdatesCallbacks = this.dayUpdatesCallbacks || [];
        this.dayUpdatesCallbacks.push(callback);
    }

    subscribeForRealSecondsUpdates(callback : Action) : void {
        this.realSecondsUpdatesCallbacks = this.realSecondsUpdatesCallbacks || [];
        this.realSecondsUpdatesCallbacks.push(callback);
    }

    addSecond() : void {
        this.seconds++;

        if (this.seconds % this.secPerHour === 0 && this.hourUpdatesCallbacks) {
            this.hourUpdatesCallbacks.forEach(function (callback) {
                callback();
            });
        }

        if (this.seconds % this.secPerDay === 0 && this.dayUpdatesCallbacks) {
            this.dayUpdatesCallbacks.forEach(function (callback) {
                callback();
            });
        }

        if (this.seconds % 60 === 0 && this.realSecondsUpdatesCallbacks) {
            this.realSecondsUpdatesCallbacks.forEach(function (callback) {
                callback();
            });
        }
    }
}