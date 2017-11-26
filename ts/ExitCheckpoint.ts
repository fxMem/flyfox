/**
 * Created by memo on 21.01.2017.
 */
class ExitCheckpoint extends Checkpoint {
    target: MapPosition;
    door: boolean;
    constructor(a: ExitCheckpointConstructorParameters) {
        super(a);

        this.target = a.target;
        this.door = a.door;
    }

    setDestination(pages: any): void {
        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let list = page.list.first(function (l) {
                return l.code == 201;
            });

            if (list) {
                this.target = MapPosition.create({
                    x: list.parameters[2],
                    y: list.parameters[3],
                    mapId: list.parameters[1]
                });

                break;
            }
        }
    }

    static check(a: ConstructorParameters): boolean {
        if (isCheckpointParameters(a)) {
            return a.color == 2;
        }

        return false;
    }
}

Types.register(ExitCheckpoint);