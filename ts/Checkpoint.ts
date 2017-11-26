/**
 * Created by memo on 21.01.2017.
 */
interface CheckpointConstructorParameters extends ConstructorParameters {
    color : number;
    pos : MapPosition;
}

function isCheckpointParameters(a: ConstructorParameters): a is CheckpointConstructorParameters {
    let cp = (<CheckpointConstructorParameters>a);
    return cp.color !== undefined && cp.pos != undefined;
}

class CheckpointRef {
    constructor(public checkpointId : number, public mapId : number) {

    }

    copy(): CheckpointRef {
        return new CheckpointRef(this.checkpointId, this.mapId);
    }
}

class Checkpoint {
    typeId: string;
    id : number;
    notes : NoteParameters;
    pos : MapPosition;
    color : number;

    constructor(a: CheckpointConstructorParameters) {
        this.typeId = getTypeId(this);
        this.notes = a.notes;
        this.color = a.color;
        this.pos = a.pos;
        this.id = a.id;
    }

    getRef() : CheckpointRef {
        return new CheckpointRef(this.id, this.pos.mapId);
    }
}

// maybe I should use generic parameter instead createBot func?
// UPDATE: it might be a good idea to have specific checkpoint type 
abstract class SpawnCheckpoint extends Checkpoint {
    constructor(a : CheckpointConstructorParameters) {
        super(a);
    }

    abstract createBot(a : BotConstructorParameters) : Bot;
}

interface ExitCheckpointConstructorParameters extends CheckpointConstructorParameters {
    target : MapPosition;
    door : boolean;
}



