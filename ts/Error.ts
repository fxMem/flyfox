/**
 * Created by memo on 21.01.2017.
 */
 
class FlyfoxError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        // Object.setPrototypeOf(this, FlyfoxError.prototype);
    }
}