/**
 * Created by memo on 21.01.2017.
 */
class Dialogue {
    id: number;
    startBlockId: number;
    botName: string;
    blocks: DialogueBlock[] = [];

    constructor(data: any) {
        this.id = data.id;
        this.startBlockId = data.startBlockId;
        this.botName = data.botName;
        this.blocks = (data.blocks as any[]).map((v) => new DialogueBlock(v));
    }

    getBlock(blockId: number): DialogueBlock {
        if (blockId == null) {
            return this.blocks[0];
        }
        else {
            let result = this.blocks.first(b => b.id == blockId);
            if (!result) {
                throw new FlyfoxError(`Current block with blockId ${blockId} do not exists!`);
            }

            return result;
        }
    }
}