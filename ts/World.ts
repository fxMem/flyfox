/**
 * Created by memo on 22.01.2017.
 */
class World {
    private static flyfoxDialoguesFilename = 'FlyfoxDialogues.json';
    private static flyfoxDialoguesVarName = '$dialoguesData';

    static instance: World;
    static log: Log;

    private static fileManager: FileManager;
    private static cacheManager: CacheManager;

    private mapManager: MapManager;
    private saveManager: SaveManager;
    private questManager: QuestManager;
    private static questsEnabled = true; 

    currentTown : Town;
    time: DateTime;
    
    private constructor(private cache: FlyfoxCache) {
        World.log.verbose("Database succesfully loaded. Initializing flyfox...");

        this.mapManager = new MapManager(this.cache);
        this.time = new DateTime(0);
        if (World.questsEnabled) {
            this.questManager = new QuestManager($dialoguesData, World.cacheManager, new Log("quest", World.fileManager, LogLevel.Verbose));
        }
        else {
            // Quest manager is null - all quests are disabled
        }
        
        this.saveManager = new SaveManager(this.mapManager, this.questManager, this.time);

        this.mapManager.subscribeToMapUpdate(wrap(this.mapUpdated.bind(this)));
        this.mapManager.subscribeToMapStart(wrap(this.mapStarted.bind(this)));

        this.time.subscribeForRealSecondsUpdates(wrap(this.realSecondPassed.bind(this)));
        this.time.subscribeForHourUpdates(wrap(this.hourPassed.bind(this)));
        this.initializeTime();
    }

    static load(): void {
        try {
            World.fileManager = new FileManager(false);
            World.log = new Log("global", World.fileManager, LogLevel.Verbose);
            InvokeHelper.initialize(World.log);

            World.log.verbose("Starting world...");
            World.setupDialoguesData();

            DataManager.isDatabaseLoaded = function () {
                this.checkError();
                for (var i = 0; i < this._databaseFiles.length; i++) {
                    var name = this._databaseFiles[i].name;
                    if (!window[name]) {
                        if (name == World.flyfoxDialoguesVarName) {
                            World.disableDialogs();
                        }
                        else {
                            return false;
                        }
                    }
                }
                return true;
            };

            var original_dataManager_idDatabaseLoaded = DataManager.isDatabaseLoaded;
            DataManager.isDatabaseLoaded = function () {
                let loaded = original_dataManager_idDatabaseLoaded.call(this);
                if (loaded) {
                    run(World.onDatabaseLoaded);
                }

                return loaded;
            }

            var original_DataManager_checkError = DataManager.checkError;
            DataManager.checkError = function () {
                if (DataManager._errorUrl && (DataManager._errorUrl as string).search(World.flyfoxDialoguesFilename) != -1) {
                    run(World.disableDialogs);
                }
                else {
                    original_DataManager_checkError.call(this);
                }
            };

            //var original_DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
        } catch (e) {
            let text = `Error while initializing flyfox engine. Flyfox will be disabled. Error: ${e.toString()}`;
            if (World.log) {
                World.log.critical(text);
            } else {
                console.log(text);
            }

            InvokeHelper.disable();
        }
    }

    private static disableDialogs() {
        if (World.questsEnabled) {
            World.log.verbose(`${World.flyfoxDialoguesFilename} is not found! Disabling Flyfox.Quests subsystem...`);
            World.questsEnabled = false;
        }
    }

    private static setupDialoguesData(): void {
        DataManager._databaseFiles.push({ name: '$dialoguesData', src: World.flyfoxDialoguesFilename });
    }

    private static onDatabaseLoaded(): void {
        World.cacheManager = new CacheManager(World.fileManager);
        World.cacheManager.subscribeOnLoad(wrap(World.onCacheLoaded));
    }

    private static onCacheLoaded(): void {
        if (!World.instance) {
            World.instance = new World(World.cacheManager.cache);
        }
    }

    currentMapId() : number {
        return $gameMap._mapId;
    }

    currentMap() : Map {
        return this.mapManager.maps[$gameMap._mapId];
    }

    getMap(id : number) : Map {
        return this.mapManager.maps[id];
    }

    private initializeTime(): void {
        var gameTime_Scene_Base_update = Scene_Base.prototype.update;
        let that = this;
        Scene_Base.prototype.update = function () {
            gameTime_Scene_Base_update.call(this);

            if (that.time) {
                run(that.time.addSecond.bind(that.time));
            }
        }
    }

    private realSecondPassed() : void {
        if (this.currentTown) {
            this.currentTown.realSecondPassed();
        }
    }

    private hourPassed() : void {
        if (this.currentTown) {
            this.currentTown.hourPassed();
        }
    }

    private mapUpdated() : void {
        this.currentTown.update();
    }

    private mapStarted() : void {
        let mapId = this.currentMapId();
        console.log(`map ${mapId} started`);
        if (!this.currentTown) {
            this.loadNewTown();
            return;
        }

        if (this.currentTown.containsMap(mapId)) {
            this.currentTown.mapStarted();
        }
        else {
            this.currentTown.dispose();
            this.loadNewTown();
        }
    }

    private loadNewTown() : void {
        let currentMap = this.currentMap();
        let townId = currentMap.townId;
        this.currentTown = new Town(townId, this.mapManager, this);
        this.currentTown.mapStarted();
    }

}