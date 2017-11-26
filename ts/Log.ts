/**
 * Created by memo on 21.01.2017.
 */
enum LogLevel {
    Verbose = 1,
    Warning,
    Error,
    Critical
}

class Log {
    private logFileName: string;

    constructor(private logger: string, private fileManager: FileManager, private level: LogLevel) {
        this.logFileName = `flyfoxLog-${this.logger}.txt`;
        this.initialize();
    }

    setLogLevel(level: LogLevel): void {
        this.level = level;
    }

    initialize(): void {
        this.writeToFile(`-----${this.getTime()}-----\r\n`);
    }

    write(message: string, level: LogLevel): void {
        if (this.checkLevel(level)) {
            this.writeToFile(this.createMessage(message, level));
        }
    }

    verbose(message: string): void {
        this.write(message, LogLevel.Verbose);
    }

    warning(message: string): void {
        this.write(message, LogLevel.Warning);
    }

    error(message: string): void {
        this.write(message, LogLevel.Error);
    }

    critical(message: string): void {
        this.write(message, LogLevel.Critical);
    }

    private checkLevel(level: LogLevel): boolean {
        return level >= this.level;
    }

    private createMessage(message: string, level: LogLevel): string {
        let output = `[${this.logger}, ${LogLevel[level]}](${this.getTime()}) - ${message}\r\n`;
        return output;
    }

    private getTime(): string {
        //return "";
        let date = new Date();
        let day = date.getDate();
        let monthIndex = date.getMonth();
        let year = date.getFullYear();
        let hh = date.getHours();
        let mm = date.getMinutes();
        let sec = date.getSeconds();
        return `${year}-${monthIndex + 1}-${day} ${hh}:${mm}:${sec}`;
    }

    private writeToFile(data: string): void {
        this.fileManager.append(this.logFileName, data);
    }
}