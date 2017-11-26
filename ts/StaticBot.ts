/**
 * Created by memo on 21.01.2017.
 */
 
class StaticBotRef implements BotInfo {
    private identityString: string;

    constructor(public id: number, public name: string, public displayName: string, public greeting: string = "Welcome!") {
        this.displayName = this.displayName || this.name;
        this.identityString = `Static bot, Id = ${this.id}, Name = ${this.name}, DisplayName = ${this.displayName}`;
    } 

    getIdentityString(): string {
        return this.identityString;
    }
}