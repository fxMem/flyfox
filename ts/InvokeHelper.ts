/**
 * Created by memo on 21.01.2017.
 */
 
// All callback invocations should be done via this function
function run(callback: Action) {
    InvokeHelper.run.call(this, callback);
}

function wrap(callback: Action): Action {
    return function() { InvokeHelper.run.call(this, callback); };
}

class InvokeHelper {
    private static logger: Log;
    private static disabled: boolean;
    private static stopOnExceptions: boolean;

    static initialize(log: Log, stopOnExceptions: boolean = true): void {
        InvokeHelper.logger = log;
        InvokeHelper.stopOnExceptions = stopOnExceptions;
    }

    static disable(): void {
        InvokeHelper.disabled = true;
        if (InvokeHelper.logger) {
            InvokeHelper.logger.verbose(`flyfox engine execution disabled`);
        }
    }

    static run(callback: Action): void {
        if (InvokeHelper.disabled) {
            return;
        }

        try {
            callback.call(this);
        } catch (e) {
            let text: string;
            if (e instanceof flyfoxError) {
                text = `flyfox error: ${e.message}, stack: ${e.stack}`;
            }
            else {
                text = `Generic error:  ${e.message}, stack: ${e.stack}`;
            }

            InvokeHelper.logger.error(text);
            if (InvokeHelper.stopOnExceptions) {
                InvokeHelper.logger.error(`flyfox engine stopped.`);
                InvokeHelper.disabled = true;
            }
        }
    }
}