/**
 * Created by memo on 21.01.2017.
 */
interface WriteFunc {
    (fs: any, fileName: string, content: string): void;
}

class FileManager {
    private static directoryName = "flyfox";

    constructor(private compress: boolean) {

    }

    exists(name : string) : boolean {
        return false;
        /*if (StorageManager.isLocalMode()) {
            var fs = require('fs');
            var filePath = Utils.localFilePath(Utils.directoryName, title);
            return fs.existsSync(filePath);
        }
        else {
            return !!localStorage.getItem(Utils.getExistsKey(title));
        }*/
    }

    write(name: string, content: string): void {
        this.writeInternal(name, content, false);
    }

    append(name: string, content: string): void {
        this.writeInternal(name, content, true);
    }

    read(name : string) : string {
        let data : string;
        if (StorageManager.isLocalMode()) {
            data = this.loadFromLocalFile(FileManager.directoryName + name);
        } else {
            data = this.loadFromWebStorage(name);
        }

        return this.compress ? LZString.decompressFromBase64(data) : data;
    }

    private writeInternal(name: string, content: string, append: boolean) {
        let data = this.prepareData(content);
        if (StorageManager.isLocalMode()) {
            this.storeToFile(name, data, append);
        } else {
            this.storeToWebStorage(name, data, append);
        }
    }

    private prepareData(input: string): string {
        return this.compress ? LZString.compressToBase64(input) : input;
    }

    private loadFromWebStorage(name : string) : string {
        var key = name;
        var data = localStorage.getItem(key);
        return data;
    }

    private loadFromLocalFile(name : string) : string {
        var data = null;
        var fs = require('fs');
        if (fs.existsSync(name)) {
            data = fs.readFileSync(name, { encoding: 'utf8' });
        }
        else {
            throw new Error("Flyfox cache not found!");
        }
        return data;
    }

    private storeToWebStorage(name: string, content: string, append: boolean): void {
        let result: string;
        if (append) {
            let existingData = this.loadFromWebStorage(name) || "";
            result = existingData + content;
        }
        else {
            result = content;
        }

        localStorage.setItem(name, content);
    }

    private storeToFile(name: string, content: string, append: boolean): void {
        var fs = require('fs');
        var dirPath = this.getLocalDirectoryPath(FileManager.directoryName);
        var filePath = this.getLocalFilePath(FileManager.directoryName, name);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        if (append && fs.existsSync(filePath)) {
            fs.appendFileSync(filePath, content);
        }
        else {
            fs.writeFileSync(filePath, content);
        }
    }

    private getLocalDirectoryPath(directory : string) : string {
        var path = window.location.pathname.replace(/(\/www|)\/[^\/]*$/, '/' + directory + '/');
        if (path.match(/^\/([A-Z]\:)/)) {
            path = path.slice(1);
        }
        return decodeURIComponent(path);
    }

    private getLocalFilePath(directory : string, filename : string) : string {
        return this.getLocalDirectoryPath(directory) + filename;
    }
}