/**
 * Created by memo on 19.01.2017.
 */
class MapManager {
    private mapUpdateCallbacks : Action[] = [];
    private mapStartCallbacks : Action[] = [];
    maps : Map[];
    bots : Bot[];

    constructor(private cache: FlyfoxCache) {
        this.registerUpdateCallback();

        this.maps = cache.maps;
        this.initializeBots(cache.bots.dynamicBots);
    }

    initializeBots(bots: Bot[]): void {
        var botsCopy = bots.map(b => b.copy() as Bot);
        this.bots = botsCopy;
    }

    subscribeToMapUpdate(callback : Action) : void {
        this.mapUpdateCallbacks.push(callback);
    }

    subscribeToMapStart(callback : Action) : void {
        this.mapStartCallbacks.push(callback);
    }

    private invokeMapUpdateCallbacks() : void {
        this.mapUpdateCallbacks.forEach((c) => { run(c); });
    }

    private invokeMapStartCallbacks() : void {
        this.mapStartCallbacks.forEach((c) => { run(c); });
    }

    private registerUpdateCallback() : void {
        let flyfox_Scene_Map_update = Scene_Map.prototype.update;
        let flyfox_Scene_Map_start = Scene_Map.prototype.start;

        var mapManager = this;
        Scene_Map.prototype.update = function() {
            flyfox_Scene_Map_update.call(this);
            run(mapManager.mapUpdated.bind(mapManager));
        }

        Scene_Map.prototype.start = function () {
            flyfox_Scene_Map_start.call(this);
            run(mapManager.mapStarted.bind(mapManager));
        }
    }

    private mapUpdated() : void {
        this.invokeMapUpdateCallbacks();
    }

    private mapStarted() : void {
        this.invokeMapStartCallbacks();
    }
}