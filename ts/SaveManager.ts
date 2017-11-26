/**
 * Created by memo on 21.01.2017.
 */
 
class SaveManager {

    constructor(private mapManager: MapManager, private questManager: QuestManager, private dateTime: DateTime) {
        this.initialize();
    }

    private initialize(): void {

        let DataManager_makeSaveContents = DataManager.makeSaveContents;
        let DataManager_extractSaveContents = DataManager.extractSaveContents;
        var that = this;
        DataManager.makeSaveContents = function () {
            var saveData = DataManager_makeSaveContents.call(this);

            run(() => { that.appendSaveData(saveData); });
            return saveData;
        };

        DataManager.extractSaveContents = function (contents) {
            DataManager_extractSaveContents.call(this, contents);

            run(() => that.extractSaveData(contents));
        }
    }

    private appendSaveData(save: any): void {
        save.flyfoxBots = this.mapManager.bots.map(b => b.pack());
        save.flyfoxQuestProgress = this.questManager && this.questManager.progress;
        save.dateTimeSec = this.dateTime.seconds;
    }

    private extractSaveData(save: any): void {
        if (save.flyfoxBots) {
            let bots = (save.flyfoxBots as any[]).map(bd => Bot.revive(bd));
            this.mapManager.initializeBots(bots);
        }

        if (save.flyfoxQuestProgress && this.questManager) {
            this.questManager.setProgress(save.flyfoxQuestProgress);
        }

        if (save.dateTimeSec) {
            this.dateTime.seconds = save.dateTimeSec;
        }
    }
}
