import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerState extends Schema {
    @type("string") id: string = "";
    @type("string") username: string = "";
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("string") direction: string = "down";
    @type("boolean") isMoving: boolean = false;
    @type("number") clothesIndex: number = 1;
}

export class GameState extends Schema {
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
