/**
 * Created by memo on 21.01.2017.
 */
class BotCollection {
    private nextId: number = 0;
    dynamicBots: Bot[] = [];
    staticBots: StaticBotRef[] = [];

    constructor() {

    }

    add(bot: Bot | StaticBotRef) {
        if (bot instanceof Bot) {
            this.dynamicBots.push(bot);
        }
        else {
            this.staticBots.push(bot);
        }
    }

    getNextId(): number {
        this.nextId++;
        return this.nextId;
    }
}