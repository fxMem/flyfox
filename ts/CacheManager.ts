/**
 * Created by memo on 21.01.2017.
 */
class FlyfoxCache {
    maps: Map[] = [];
    bots: BotCollection;
    //bots: Bot[] = [];
    //staticBots: StaticBotRef[] = [];

    constructor() {
        this.bots = new BotCollection();
    }

    pack(): any {
        return {
            maps: this.maps,
            bots: this.bots.dynamicBots.map(b => b.pack()),
            staticBots: this.bots.staticBots
        };
    }
}


interface StaticBotsSource {
    getStaticBotByName(name: string): StaticBotRef;
}

class CacheManager implements StaticBotsSource {
    readonly storageFileName = "Flyfox_map_cache.ai";
    private currentMapId : number;
    private currentFilename : string;
    private loadedCallback: Action;
    private loaded: boolean;
    private callbackInvoked: boolean;
    private sbMap: Dictionary<StaticBotRef> = {};

    cache: FlyfoxCache;

    constructor(private fileManager: FileManager) {
        this.cache = new FlyfoxCache();
        if (fileManager.exists(this.storageFileName)) {
            this.loadMapCache();
        }
        else {
            this.createMapCache();
        }
    }

    subscribeOnLoad(callback : Action) : void {
        this.loadedCallback = callback;

        if (this.loaded) {
            this.invokeLoadCallback();
        }
    }

    getStaticBotByName(name: string): StaticBotRef {
        return this.sbMap[name];
    }

    private loadMapCache() : void {

    }

    private createMapCache() : void {
        this.currentMapId = 0;
        this.loadNextMap();
    }

    private loadNextMap() : void {
        this.currentMapId++;
        let paddedId = this.currentMapId.padZero(3);
        this.currentFilename = `Map${paddedId}.json`;
        this.loadFile(this.currentFilename);
    }

    private onFileLoaded(data : any) : void {
        let mapId = this.currentMapId;
        let notes = NoteParameters.create(data.note);
        let map = Factories.mapFactory.create({
            data,
            filename : this.currentFilename,
            id : this.currentMapId,
            notes,
            outputBotCollection: this.cache.bots
        });

        this.cache.maps[mapId] = map;
        this.loadNextMap();
    }

    private onLoaded(): void {
        if (this.callbackInvoked) {
            return;
        }

        this.callbackInvoked = true;
        this.loaded = true;

        this.buildStaticBotsMap();

        this.invokeLoadCallback();
    }

    private onLoadError() : void {
        this.save();
    }

    private invokeLoadCallback(): void {
        if (this.loadedCallback) {
            this.loadedCallback();
        }
    }

    private buildStaticBotsMap(): void {
        for (let sb of this.cache.bots.staticBots) {
            if (this.sbMap[sb.name]) {
                throw new FlyfoxError(`Duplicate static bot with name ${sb.name}! All static bot names must be unique!`);
            }

            this.sbMap[sb.name] = sb;
        }
    }

    private save(): void {
        this.fileManager.write(this.storageFileName, JSON.stringify(this.cache.pack()));
        this.onLoaded();
    }

    private loadFile(path : string) : void {
        var xhr = new XMLHttpRequest();
        var url = 'data/' + path;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = () => {
            var status = xhr.status;
            if (status < 400) {
                this.onFileLoaded(JSON.parse(xhr.responseText));
            }
            else if (status == 404) {
                this.onLoadError();
            }
        };
        xhr.onerror = () => {
            this.onLoadError();
        };

        xhr.send();
    }
}