/**
 * Created by memo on 21.01.2017.
 */
interface ConstructorParameters {
    id : number;
    notes: NoteParameters;
}

interface Constructor<T> {
    new(a : ConstructorParameters) : T;
    check? (a: ConstructorParameters): boolean;
    typeIdentifier? : string;
}
 
const FactoryTypeKey = "type";
class Factory<T> {
    private types : Constructor<T>[] = [];
    private checkDefault(c: Constructor<T>, a: ConstructorParameters) {
        return a.notes.valueExists(c.typeIdentifier) ||
            a.notes.getValue(FactoryTypeKey) == c.typeIdentifier;
    }

    create<E extends ConstructorParameters>(a : E) : T {
        for (let type of this.types) {
            if (type.check) {
                if (type.check(a)) {
                    return new type(a);
                }
            }
            else if (type.typeIdentifier) {
                if (this.checkDefault(type, a)) {
                    return new type(a);
                }
            }
            else {
                throw new Error("Cannot find way to determine if this class available or not.")
            }
        }

        return null;
    }

    register(type : Constructor<T>) {
        this.types.push(type);
    }
}

class Factories {
    static mapFactory = new Factory<Map>();
    static checkPointFactory = new Factory<Checkpoint>();
    //static actionFactory = new Factory<BotAction>();
    //static botFactory = new Factory<Bot>();
}