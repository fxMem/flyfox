/**
 * Created by memo on 21.01.2017.
 */
class ActionContext {
    constructor(public map : Map, public bot : Bot, public previousContext : ActionContext, public session : any) {

    }
}