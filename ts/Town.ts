/**
 * Created by memo on 19.01.2017.
 */
 
class Town {
    private botManager : BotManager;
    private mapJustStarted : boolean;

    maps : Map[] = [];
    bots : Bot[] = [];
    mapsLookup : Dictionary<Map> = {};
    botsLookup : Dictionary<Bot> = {};


    constructor(public id : number, private mapManager : MapManager, public world : World) {
        for (let map of mapManager.maps) {
            if (!map) {
                continue;
            }

            if (map.townId != this.id) {
                continue;
            }

            this.mapsLookup[map.id] = map;
            this.maps.push(map);
        }

        for (let bot of mapManager.bots) {
            if (this.mapsLookup[bot.mapId()]) {
                this.botsLookup[bot.id] = bot;
                this.bots.push(bot);
            }
        }

        this.botManager = new BotManager(this);
    }

    containsMap(mapId : number) : boolean {
        return !!this.mapsLookup[mapId];
    }

    update() : void {
        this.botManager.update(false);
    }

    realSecondPassed() : void {
        this.botManager.realSecondPassed();
    }

    hourPassed() : void {
        this.botManager.hourPassed();
    }

    mapStarted() : void {
        this.botManager.update(true);
    }

    dispose(): void {
        this.botManager.dispose();
    }
}