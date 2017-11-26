/**
 * Created by memo on 21.01.2017.
 */
 
class StreetMap extends Map {
    constructor(a: MapConstructorParameters) {
        super(a);
    }

    static check(a: ConstructorParameters): boolean {
        return !a.notes.valueExists(FactoryTypeKey);
    }
}

Types.register(StreetMap);