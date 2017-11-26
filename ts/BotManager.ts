/**
 * Created by memo on 19.01.2017.
 */

class BotManager {
    private world : World;
    private bots : Bot[] = [];
    private sessionsContexts : Dictionary<any> = {};
    private previousContexts : Dictionary<ActionContext> = {};

    constructor(private town : Town) {
        this.world = town.world; 
        for (let bot of this.town.bots) {
            this.bots.push(bot);
            bot.activate(this);
        }
    }


    update(mapJustStarted : boolean) : void {
        for (let bot of this.bots) {
            let context = this.getUpdateContext(bot);
            bot.update(context);
        }
    }

    dispose(): void {
        for (let bot of this.bots) {
            bot.deactivate();
        }
    }

    realSecondPassed() : void {
        for (let bot of this.bots) {
            if (!bot.isVisible()) {
                bot.moveDone();
            }
        }
    }

    hourPassed() : void {
        for (let bot of this.bots) {
            bot.selectState();
        }
    }

    private getUpdateContext(bot : Bot) : ActionContext {
        let map = bot.getMap();

        let previousContext = this.previousContexts[map.id];
        let sessionContext = this.getSessionContext(map.id);
        let context = new ActionContext(map, bot, previousContext, sessionContext);
        this.previousContexts[map.id] = context;

        return context;
    }

    private getSessionContext(mapId: number): any {
        let sessionContext = this.sessionsContexts[mapId] || {};
        if (!this.sessionsContexts[mapId]) {
            this.sessionsContexts[mapId] = sessionContext;
        }

        return sessionContext;
    }

}