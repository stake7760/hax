import { ChatSounds, ChatStyle, Colors as HaxballColors, Event, Module, type Player, type Room, Teams } from "haxball-extended-room";

// Parametros globais
const DefaultGameTime = 10; // Tempo de jogo padrao se 0 for selecionado

const throwTimeOut = 420; // 7 segundos em ticks
const gkTimeOut = 600; // 10 segundos em ticks
const ckTimeOut = 600; // 10 segundos em ticks
const throwinDistance = 270; // Distância que os jogadores podem mover a bola durante um arremesso lateral
// var mapBGColor = "86A578"; // Padrão: 718C5A

interface Point {
    x: number;
    y: number;
}

class Game {
    public ticks: number;
    public time: number;
    public active: boolean;
    public paused: boolean;
    public ballRadius: number | undefined;
    public rsTouchTeam: number;
    public rsActive: boolean;
    public rsReady: boolean;
    public rsCorner: boolean;
    public rsGoalKick: boolean;
    public rsSwingTimer: number;
    public rsTimer: number;
    public ballOutPositionX: number | undefined;
    public ballOutPositionY: number | undefined;
    public throwInPosY: number | undefined;
    public outStatus: string;
    public warningCount: number;
    public bringThrowBack: boolean;
    public extraTime: boolean;
    public extraTimeCount: number;
    public extraTimeEnd: number | undefined;
    public extraTimeAnnounced: boolean;
    public lastPlayAnnounced: boolean;
    public boosterCount: number;
    public boosterState: boolean;
    public throwinKicked: boolean;
    public pushedOut: boolean | undefined;

    constructor() {
        this.ticks = 0;
        this.time = 0;
        this.active = true;
        this.paused = false;
        this.ballRadius = undefined;
        this.rsTouchTeam = 0;
        this.rsActive = true;
        this.rsReady = false;
        this.rsCorner = false;
        this.rsGoalKick = false;
        this.rsSwingTimer = 1000;
        this.rsTimer =  0;
        this.ballOutPositionX = undefined;
        this.ballOutPositionY = undefined;
        this.throwInPosY = undefined;
        this.outStatus = "";
        this.warningCount = 0;
        this.bringThrowBack = false;
        this.extraTime = false;
        this.extraTimeCount = 0;
        this.extraTimeEnd = undefined;
        this.extraTimeAnnounced = false;
        this.lastPlayAnnounced = false;
        this.boosterCount = 0
        this.boosterState = false;
        this.throwinKicked = false;
        this.pushedOut = undefined;
    }
}

@Module
export class RealSoccerModule {
    public game: Game;
    private gameTime = 0;
    private active = false;

    constructor(private room: Room) {
        this.game = new Game();
        this.room.customEvents.removeAllListeners("realSoccerToggle");
        this.room.customEvents.on("realSoccerToggle", (enabled: boolean) => {
            this.active = enabled;
            if (!enabled) this.game = new Game();
        });
        this.active = (this.room.state as any).currentStadiumName === "Real Soccer Revolution";
    }

    @Event
    onGameStart(byPlayer: Player | null): void {
        if (!this.active || !this.room) return;

        if (!byPlayer) {
            this.notifyGameTime(this.room);
            this.game = new Game();
            return;
        }

        this.updateGameTime(this.room);
        this.restartGame(this.room);
    }

    public ballWarning(origColour: number, warningCount: number): void {
        const flashes = [
            { time: 200, color: 0xffffff },
            { time: 400, color: origColour },
            { time: 600, color: 0xffffff },
            { time: 800, color: origColour },
            { time: 1000, color: 0xffffff },
            { time: 1200, color: origColour },
            { time: 1400, color: 0xffffff },
            { time: 1600, color: origColour },
            { time: 1675, color: 0xffffff },
            { time: 1750, color: origColour }
        ];
    
        for (const flash of flashes) {
            this.sleep(flash.time).then(() => {
                if (this.game.warningCount === warningCount && this.room && this.room.ball) {
                    this.room.ball.color = flash.color;
                }
            });
        }
    }

    public blockGoalKick(): void {
        if (!this.room) return;
        const players = Array.from(this.room.players.values()).filter((player) => player.team !== 0);
        const ballPositionX = this.room.ball.x;
    
        if (ballPositionX == null) return;
    
        if (ballPositionX < 0) {
            if (this.game.outStatus === "redGK") {
                for (const player of players) {
                    if (player.team === 2 && player.x && player.x < 0) {
                        if (player.cGroup !== 268435462) {
                            player.cGroup = 268435462;
                        }
                        if (player.position.x < -840 && player.position.y > -320 && player.position.y < 320) {
                            this.updatePlayerxPosition(player.id, -825);
                        }
                    }
                    if (player.team === 1 && player.cGroup !== 2) {
                        player.cGroup = 2;
                    }
                };
            }
        }
    
        if (ballPositionX > 0) {
            if (this.game.outStatus === "blueGK") {
                for (const player of players) {
                    if (player.team === 1 && player.x && player.x > 0) {
                        if (player.cGroup !== 268435462) {
                            player.cGroup = 268435462;
                        }
                        if (player.position.x > 840 && player.position.y > -320 && player.position.y < 320) {
                            this.updatePlayerxPosition(player.id, 825);
                        }
                    }
                    if (player.team === 2 && player.cGroup !== 2) {
                        player.cGroup = 2;
                    }
                };
            }
        }
    }

    public blockThrowIn(): void {
        if (!this.room) return;
        const players = Array.from(this.room.players.values()).filter((player) => player.team !== 0);
        const ballPositionY = this.room.ball.y;
        
        if (ballPositionY == null) return;

        if (ballPositionY < 0) {
            if (this.game.outStatus === "redThrow") {
                for (const player of players) {
                    if (player.team === 2 && player.y && player.y < 0) {
                        if (player.cGroup !== 536870918) {
                            player.cGroup = 536870918;
                        }
                        if (player.position.y < -485) {
                            player.y = -470;
                        }
                    }
                    if (player.team === 1 && player.cGroup !== 2) {
                        player.cGroup = 2;
                    }

                    this.updateDiscxPosition(17, 1149);
                    this.updateDiscxPosition(19, -1149);
                };
            }

            if (this.game.outStatus === "blueThrow") {
                for (const player of players) {
                    if (player.team === 1 && player.y && player.y < 0) {
                        if (player.cGroup !== 536870918) {
                            player.cGroup = 536870918;
                        }
                        if (player.position.y < -485) {
                            player.y = -470;
                        }
                    }
                    if (player.team === 2 && player.cGroup !== 2) {
                        player.cGroup = 2;
                    }

                    this.updateDiscxPosition(19, 1149);
                    this.updateDiscxPosition(17, -1149);
                };
            }
        }

        if (ballPositionY > 0) {
            if (this.game.outStatus === "redThrow") {
                for (const player of players) {
                    if (player.team === 2 && player.y && player.y > 0) {
                        if (player.cGroup !== 536870918) {
                            player.cGroup = 536870918;
                        }
                        if (player.position.y > 485) {
                            player.y = 470;
                        }
                    }
                    if (player.team === 1 && player.cGroup !== 2) {
                        player.cGroup = 2;
                    }

                    this.updateDiscxPosition(21, 1149);
                    this.updateDiscxPosition(23, -1149);
                };
            }

            if (this.game.outStatus === "blueThrow") {
                for (const player of players) {
                    if (player.team === 1 && player.y && player.y > 0) {
                        if (player.cGroup !== 536870918) {
                            player.cGroup = 536870918;
                        }
                        if (player.position.y > 485) {
                            player.y = 470;
                        }
                    }
                    if (player.team === 2 && player.cGroup !== 2) {
                        player.cGroup = 2;
                    }

                    this.updateDiscxPosition(23, 1149);
                    this.updateDiscxPosition(21, -1149);
                };
            }
        }
    }

    public extraTime(room: Room): void {
        const extraSeconds = Math.ceil(this.game.extraTimeCount / 60);
        this.game.extraTimeEnd = (this.gameTime * 60) + extraSeconds;
        room.send({
            message: `⏳ Acréscimo: ${extraSeconds} segundos.`,
            color: HaxballColors.YellowGreen,
            style: ChatStyle.Bold,
            sound: ChatSounds.None
        });
    }

    public handleBallTouch(): void {
        if (this.room == null || this.game.ballRadius === undefined) return;
        const players = this.room.players.values();
        const ballX = this.room.ball.x;
        const ballY = this.room.ball.y;

        if (ballX == null || ballY == null) return;

        const ballPosition: Point = { x: ballX, y: ballY };
        const ballRadius = this.game.ballRadius;
        const playerRadius = 15;
        const triggerDistance = ballRadius + playerRadius + 0.01;

        for (const player of players) {
            if (player.position == null) continue;
            const distanceToBall = this.pointDistance(player.position as Point, ballPosition);
            if (distanceToBall < triggerDistance) {
                this.game.rsTouchTeam = player.team;
                this.game.throwinKicked = false;

                if (!this.game.rsCorner && this.room && this.room.ball.xgravity !== 0) {
                    this.room.ball.xgravity = 0;
                    this.room.ball.ygravity = 0;
                    this.game.rsSwingTimer = 10000;
                }
            }
        };
    }

    public notifyGameTime(room: Room): void {
        if (!this.room) return;

        const timeLabel = this.gameTime === 1 ? "minuto" : "minutos";

        room.send({
            message: `⏳ Tempo de Jogo: ${this.gameTime} ${timeLabel}.`,
            color: HaxballColors.YellowGreen,
            style: ChatStyle.Bold,
            sound: ChatSounds.None
        });
    }

    public pointDistance(p1: Point, p2: Point) {
        const d1 = p1.x - p2.x;
        const d2 = p1.y - p2.y;
        return Math.sqrt(d1 * d1 + d2 * d2);
    }

    public realSoccerRef(): void {
        this.blockThrowIn();
        this.blockGoalKick();
        this.removeBlock();

        if (!this.room || !this.room.ball) return;

        if (this.game.time === this.gameTime * 60 && !this.game.extraTimeAnnounced) {
            this.extraTime(this.room);
            this.game.extraTimeAnnounced = true;
        }
        
        if (this.game.time === this.game.extraTimeEnd && !this.game.lastPlayAnnounced) {
            this.room.send({
                message: "📢 Última Jogada.",
                color: HaxballColors.Yellow,
                style: ChatStyle.Bold,
                sound: ChatSounds.None
            });
            this.game.lastPlayAnnounced = true;
        }
        
        if (this.game.rsCorner || this.game.rsGoalKick) {
            this.game.extraTimeCount++;
        }
        
        if (this.game.rsTimer < 99999 && !this.game.paused && !this.game.rsActive && this.game.rsReady) {
            this.game.rsTimer++;
        }
        
        if (this.game.rsSwingTimer < 150 && !this.game.rsCorner && !this.game.rsGoalKick) {
            this.game.rsSwingTimer++;
            if (this.game.rsSwingTimer > 5) {
                this.room.ball.xgravity = this.room.ball.xgravity ? this.room.ball.xgravity * 0.97 : 0;
                this.room.ball.ygravity = this.room.ball.ygravity ? this.room.ball.ygravity * 0.97 : 0;
            }        
            if (this.game.rsSwingTimer === 150) {
                this.room.ball.xgravity = 0;
                this.room.ball.ygravity = 0;
            }
        }
        
        if (this.game.boosterState) {
            this.game.boosterCount++;
        }
        
        if (this.game.boosterCount > 30) {
            this.game.boosterState = false;
            this.game.boosterCount = 0;
            this.room.ball.cMask = 63;
        }
        
        if (this.room.ball.x === 0 && this.room.ball.y === 0) {    
            this.game.rsActive = true;
            this.game.outStatus = "";
        }
        
        if (!this.game.rsActive && this.game.rsReady) {
            if (this.game.outStatus === "redThrow") {
                if (this.game.rsTimer === throwTimeOut - 120) {
                    this.ballWarning(0xff3f34, ++this.game.warningCount);
                }
                if (this.game.rsTimer === throwTimeOut && !this.game.bringThrowBack) {
                    this.game.outStatus = "blueThrow";
                    this.game.rsTimer = 0;                
                    this.room.discs[3].x = 0;
                    this.room.discs[3].y = 2000;
                    this.room.discs[3].radius = 0;
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.color = 0x0fbcf9;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;
                    });
                }
            }
            else if (this.game.outStatus === "blueThrow") {
                if (this.game.rsTimer === throwTimeOut - 120) {
                    this.ballWarning(0x0fbcf9, ++this.game.warningCount);
                }
                if (this.game.rsTimer === throwTimeOut && !this.game.bringThrowBack) {
                    this.game.outStatus = "redThrow";
                    this.game.rsTimer = 0;                        
                    this.room.discs[3].x = 0;
                    this.room.discs[3].y = 2000;
                    this.room.discs[3].radius = 0;
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.color = 0xff3f34;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;
                    });
                }
            }
            else if (this.game.outStatus === "blueGK" || this.game.outStatus === "redGK") {
                if (this.game.rsTimer === gkTimeOut - 120) {
                    if (this.game.outStatus === "blueGK") {
                        this.ballWarning(0x0fbcf9, ++this.game.warningCount);
                    }
                    if (this.game.outStatus === "redGK") {
                        this.ballWarning(0xff3f34, ++this.game.warningCount);
                    }
                }
                if (this.game.rsTimer === gkTimeOut) {
                    this.game.outStatus = "";
                    this.room.ball.color = 0xffffff;
                    this.game.rsTimer = 1000000;                            
                }
            }
            else if (this.game.outStatus === "blueCK" || this.game.outStatus === "redCK") {
                if (this.game.rsTimer === ckTimeOut - 120) {
                    if (this.game.outStatus === "blueCK") {
                        this.ballWarning(0x0fbcf9, ++this.game.warningCount);
                    }
                    if (this.game.outStatus === "redCK") {
                        this.ballWarning(0xff3f34, ++this.game.warningCount);
                    }
                }
                if (this.game.rsTimer === ckTimeOut) {
                    this.game.outStatus = "";
                    this.room.discs[1].x = 0;
                    this.room.discs[1].y = 2000;
                    this.room.discs[1].radius = 0;
                    this.room.discs[2].x = 0;
                    this.room.discs[2].y = 2000;
                    this.room.discs[2].radius = 0;
                    this.room.ball.color = 0xffffff;
                    this.game.rsTimer = 1000000;                            
                }
            }
        }
        
        if (this.game.rsActive) {
            if ((this.room.ball.y && this.room.ball.y > 612 || this.room.ball.y && this.room.ball.y < -612)) {
                this.game.rsActive = false;
                if (this.game.lastPlayAnnounced) {
                    this.room.pause();
                    this.game.lastPlayAnnounced = false;
                    this.room.send({
                    message: "📢 Fim de Jogo.",
                        color: HaxballColors.PaleVioletRed,
                        style: ChatStyle.Bold,
                        sound: ChatSounds.None
                    });
                }
                
                this.room.ball.xgravity = 0;
                this.room.ball.ygravity = 0;
                
                if (this.room.ball && this.room.ball.x !== undefined && this.room.ball.x !== null) {
                    this.game.ballOutPositionX = Math.round(this.room.ball.x * 10) / 10;
                }
                if (this.room.ball.y && this.room.ball.y > 612) {
                    this.game.ballOutPositionY = 400485;
                    this.game.throwInPosY = 618;
                }
                if (this.room.ball.y && this.room.ball.y < -612) {
                    this.game.ballOutPositionY = -400485;
                    this.game.throwInPosY = -618;
                }
                if (this.room.ball.x && this.room.ball.x > 1130) {
                    this.game.ballOutPositionX = 1130;
                }
                if (this.room.ball.x && this.room.ball.x < -1130) {
                    this.game.ballOutPositionX = -1130;
                }
                
                if (this.game.rsTouchTeam === 1) {                
                    this.room.discs[3].x = this.game.ballOutPositionX;
                    this.room.discs[3].y = this.game.throwInPosY;
                    this.room.discs[3].radius = 18;
                    this.sleep(100).then(() => {
                        this.game.outStatus = "blueThrow";
                        this.game.throwinKicked = false;
                        this.game.rsTimer = 0;
                        this.game.rsReady = true;
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;
                        this.room.ball.xgravity = 0;
                        this.room.ball.ygravity = 0;
                        this.room.ball.color = 0x0fbcf9;                
                    });    
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.discs[3].x = 0;
                        this.room.discs[3].y = 2000;
                        this.room.discs[3].radius = 0;
                    });
                }
                else {                
                    this.room.discs[3].x = this.game.ballOutPositionX;
                    this.room.discs[3].y = this.game.throwInPosY;
                    this.room.discs[3].radius = 18;
                    this.sleep(100).then(() => {
                        this.game.outStatus = "redThrow";
                        this.game.throwinKicked = false;
                        this.game.rsTimer = 0;
                        this.game.rsReady = true;
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;
                        this.room.ball.xgravity = 0;
                        this.room.ball.ygravity = 0;
                        this.room.ball.color = 0xff3f34;                
                    });    
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.discs[3].x = 0;
                        this.room.discs[3].y = 2000;
                        this.room.discs[3].radius = 0;
                    });
                }
            }
        
            if (this.room.ball.x && this.room.ball.x > 1162 && (this.room.ball.y && this.room.ball.y > 124 || this.room.ball.y && this.room.ball.y < -124)) {
                this.game.rsActive = false;    
                if (this.game.lastPlayAnnounced) {
                    this.room.pause();
                    this.game.lastPlayAnnounced = false;
                    this.room.send({
                    message: "📢 Fim de Jogo.",
                        color: HaxballColors.PaleVioletRed,
                        style: ChatStyle.Bold,
                        sound: ChatSounds.None
                    });
                }
                this.room.ball.xgravity = 0;
                this.room.ball.ygravity = 0;
                for (const player of this.room.players.values()) {
                    player.invMass = 100000;
                };
                if (this.game.rsTouchTeam === 1) {                
                    this.room.discs[3].x = 1060;
                    this.room.discs[3].y = 0;
                    this.room.discs[3].radius = 18;
                    this.sleep(100).then(() => {                    
                        this.game.outStatus = "blueGK";
                        this.game.rsTimer = 0;
                        this.game.rsReady = true;
                        this.game.rsGoalKick = true;
                        this.game.rsSwingTimer = 0;
                        this.game.boosterCount = 0;
                        this.game.boosterState = false;
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.x = 1060;
                        this.room.ball.y = 0;
                        this.room.ball.color = 0x0fbcf9;
                        this.room.ball.cMask = 268435519;
                        this.room.ball.xgravity = 0;
                        this.room.ball.ygravity = 0;
                    });
                    this.sleep(3000).then(() => {
                        if (!this.room || !this.room.discs || !this.room.discs[3]) return;
                        this.room.discs[3].x = 0;
                        this.room.discs[3].y = 2000;
                        this.room.discs[3].radius = 0;
                    });
                }
                else {	
                    this.game.rsSwingTimer = 0;
                    if (this.room.ball.y && this.room.ball.y < -124) {                    
                        this.room.discs[3].x = 1140;
                        this.room.discs[3].y = -590;
                        this.room.discs[3].radius = 18;
                        this.sleep(100).then(() => {
                            this.game.rsCorner = true;
                            this.game.outStatus = "redCK";
                            this.game.rsTimer = 0;
                            this.game.rsReady = true;
                            this.game.boosterCount = 0;
                            this.game.boosterState = false;
                            if (!this.room || !this.room.ball) return;
                            this.room.ball.x = 1140;
                            this.room.ball.y = -590;
                            this.room.ball.xspeed = 0;
                            this.room.ball.yspeed = 0;
                            this.room.ball.color = 0xff3f34;
                            this.room.ball.cMask = 268435519;
                            this.room.ball.xgravity = 0;
                            this.room.ball.ygravity = 0;
                            this.room.discs[2].x = 1150;
                            this.room.discs[2].y = -670;
                            this.room.discs[2].radius = 420;
                            this.room.discs[3].x = 0;
                            this.room.discs[3].y = 2000;
                            this.room.discs[3].radius = 0;
                        });
                    }
                    if (this.room.ball.y && this.room.ball.y > 124) {
                        this.room.discs[3].x = 1140;
                        this.room.discs[3].y = 590;
                        this.room.discs[3].radius = 18;
                        this.sleep(100).then(() => {
                            this.game.rsCorner = true;
                            this.game.outStatus = "redCK";
                            this.game.rsTimer = 0;
                            this.game.rsReady = true;
                            this.game.boosterCount = 0;
                            this.game.boosterState = false;
                            if (!this.room || !this.room.ball) return;
                            this.room.ball.x = 1140;
                            this.room.ball.y = 590;
                            this.room.ball.xspeed = 0;
                            this.room.ball.yspeed = 0;
                            this.room.ball.color = 0xff3f34;
                            this.room.ball.cMask = 268435519;
                            this.room.ball.xgravity = 0;
                            this.room.ball.ygravity = 0;
                            this.room.discs[2].x = 1150;
                            this.room.discs[2].y = 670;
                            this.room.discs[2].radius = 420;
                            this.room.discs[3].x = 0;
                            this.room.discs[3].y = 2000;
                            this.room.discs[3].radius = 0;
                        });
                    }
                }
            }
            if (this.room.ball.x && this.room.ball.x < -1162 && (this.room.ball.y && this.room.ball.y > 124 || this.room.ball.y && this.room.ball.y < -124)) {
                this.game.rsActive = false;
                if (this.game.lastPlayAnnounced) {
                    this.room.pause();
                    this.game.lastPlayAnnounced = false;
                    this.room.send({
                    message: "📢 Fim de Jogo.",
                        color: HaxballColors.PaleVioletRed,
                        style: ChatStyle.Bold,
                        sound: ChatSounds.None
                    });
                }
                this.room.ball.xgravity = 0;
                this.room.ball.ygravity = 0;
                for (const player of this.room.players.values()) {
                    player.invMass = 100000;
                };
                if (this.game.rsTouchTeam === 1) {				
                    this.game.rsSwingTimer = 0;
                    if (this.room.ball.y < -124) {
                        this.room.discs[3].x = -1140;
                        this.room.discs[3].y = -590;
                        this.room.discs[3].radius = 18;
                        this.sleep(100).then(() => {
                            this.game.rsCorner = true;
                            this.game.outStatus = "blueCK";
                            this.game.rsTimer = 0;
                            this.game.rsReady = true;
                            this.game.boosterCount = 0;
                            this.game.boosterState = false;
                            if (!this.room || !this.room.ball) return;
                            this.room.ball.x = -1140;
                            this.room.ball.y = -590;
                            this.room.ball.xspeed = 0;
                            this.room.ball.yspeed = 0;
                            this.room.ball.color = 0x0fbcf9;
                            this.room.ball.cMask = 268435519;
                            this.room.ball.xgravity = 0;
                            this.room.ball.ygravity = 0;
                            this.room.discs[1].x = -1150;
                            this.room.discs[1].y = -670;
                            this.room.discs[1].radius = 420;
                            this.room.discs[3].x = 0;
                            this.room.discs[3].y = 2000;
                            this.room.discs[3].radius = 0;
                        });	
                    }
                    if (this.room.ball.y > 124) {
                        this.room.discs[3].x = -1140;
                        this.room.discs[3].y = 590;
                        this.room.discs[3].radius = 18;
                        this.sleep(100).then(() => {
                            this.game.rsCorner = true;
                            this.game.outStatus = "blueCK";
                            this.game.rsTimer = 0;
                            this.game.rsReady = true;
                            this.game.boosterCount = 0;
                            this.game.boosterState = false;
                            if (!this.room || !this.room.ball) return;
                            this.room.ball.x = -1140;
                            this.room.ball.y = 590;
                            this.room.ball.xspeed = 0;
                            this.room.ball.yspeed = 0;
                            this.room.ball.color = 0x0fbcf9;
                            this.room.ball.cMask = 268435519;
                            this.room.ball.xgravity = 0;
                            this.room.ball.ygravity = 0;
                            this.room.discs[1].x = -1150;
                            this.room.discs[1].y = 670;
                            this.room.discs[1].radius = 420;
                            this.room.discs[3].x = 0;
                            this.room.discs[3].y = 2000;
                            this.room.discs[3].radius = 0;
                        });		
                    }				
                }
                else {				
                    this.room.discs[3].x = -1060;
                    this.room.discs[3].y = 0;
                    this.room.discs[3].radius = 18;
                    this.sleep(100).then(() => {
                        this.game.outStatus = "redGK";
                        this.game.rsTimer = 0;
                        this.game.rsReady = true;
                        this.game.rsGoalKick = true;
                        this.game.rsSwingTimer = 0;
                        this.game.boosterCount = 0;
                        this.game.boosterState = false;
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.x = -1060;
                        this.room.ball.y = 0;
                        this.room.ball.color = 0xff3f34;
                        this.room.ball.cMask = 268435519;
                        this.room.ball.xgravity = 0;
                        this.room.ball.ygravity = 0;
                    });
                    this.sleep(3000).then(() => {
                        if (!this.room || !this.room.discs || !this.room.discs[3]) return;
                        this.room.discs[3].x = 0;
                        this.room.discs[3].y = 2000;
                        this.room.discs[3].radius = 0;
                    });
                }
            }
        }
        
        if (!this.game.rsActive && (this.game.outStatus === "redThrow" || this.game.outStatus === "blueThrow")) { 
            if ((this.room.ball.y && this.room.ball.y > 612 || this.room.ball.y && this.room.ball.y < -612) && this.game.ballOutPositionX !== undefined && ((this.room.ball.x && this.room.ball.x < this.game.ballOutPositionX - throwinDistance || this.room.ball.x && this.room.ball.x > this.game.ballOutPositionX + throwinDistance)) && !this.game.bringThrowBack) {              
                this.game.bringThrowBack = true;
                if (this.game.outStatus === "redThrow") {
                    this.game.rsTimer = 0;
                    this.game.warningCount++;
                    this.game.outStatus = "blueThrow";								
                    this.room.discs[3].x = 0;
                    this.room.discs[3].y = 2000;
                    this.room.discs[3].radius = 0;
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.color = 0x0fbcf9;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;	
                    });			
                }
                else if (this.game.outStatus === "blueThrow") {
                    this.game.rsTimer = 0;
                    this.game.warningCount++;
                    this.game.outStatus = "redThrow";										
                    this.room.discs[3].x = 0;
                    this.room.discs[3].y = 2000;
                    this.room.discs[3].radius = 0;	
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.color = 0xff3f34;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;
                    });
                }
                    
            }
            
            if (this.room.ball.y && this.room.ball.y < 612 && this.room.ball.y > -612 && !this.game.throwinKicked && !this.game.pushedOut) {
                if (this.game.outStatus === "redThrow") {
                    this.game.rsTimer = 0;
                    this.game.warningCount++;
                    this.game.outStatus = "blueThrow";								
                    this.room.discs[3].x = 0;
                    this.room.discs[3].y = 2000;
                    this.room.discs[3].radius = 0;
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.color = 0x0fbcf9;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;
                    });					
                }
                else if (this.game.outStatus === "blueThrow") {
                    this.game.rsTimer = 0;
                    this.game.warningCount++;
                    this.game.outStatus = "redThrow";										
                    this.room.discs[3].x = 0;
                    this.room.discs[3].y = 2000;
                    this.room.discs[3].radius = 0;	
                    this.sleep(100).then(() => {
                        if (!this.room || !this.room.ball) return;
                        this.room.ball.xspeed = 0;
                        this.room.ball.yspeed = 0;
                        this.room.ball.color = 0xff3f34;
                        this.room.ball.x = this.game.ballOutPositionX;
                        this.room.ball.y = this.game.throwInPosY;
                    });
                }
                this.game.pushedOut = true;
            }
            
            if (this.room.ball.y && this.room.ball.y < 612 && this.room.ball.y > -612 && this.game.throwinKicked) {
                this.game.outStatus = "";
                this.game.rsActive = true;
                this.game.rsReady = false;
                this.room.ball.color = 0xffffff;
                this.game.rsTimer = 1000000;
                this.game.warningCount++;
            }
            
            if (this.game.throwInPosY !== undefined && this.game.ballOutPositionX !== undefined && this.room.ball.y && this.room.ball.y.toFixed(1) === this.game.throwInPosY.toFixed(1) && this.room.ball.x && this.room.ball.x.toFixed(1) === this.game.ballOutPositionX.toFixed(1)) {
                this.game.bringThrowBack = false;
                this.game.pushedOut = false;
              }              
        }
    }

    public removeBlock(): void {
        if (!this.room) return;
        const players = Array.from(this.room.players.values()).filter((player) => player.team !== 0);
    
        if (this.game.outStatus === "") {
            for (const player of players) {
                if (player.team === 1 && player.cGroup !== 2) {
                    player.cGroup = 2;
                }
                if (player.team === 2 && player.cGroup !== 4) {
                    player.cGroup = 4;
                }
            };

            if (this.room.discs[17].x !== -1149) {
                this.updateDiscxPosition(17, -1149);
            }
            if (this.room.discs[19].x !== -1149) {
                this.updateDiscxPosition(19, -1149);
            }
            if (this.room.discs[21].x !== -1149) {
                this.updateDiscxPosition(21, -1149);
            }
            if (this.room.discs[23].x !== -1149) {
                this.updateDiscxPosition(23, -1149);
            }
        }
    }
    

    public restartGame(room: Room): void {
        if (!room) return;

        room.stop();
        room.setTimeLimit(0);
        room.start();
    }

    public sleep (time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    public updateGameStatus(): void {
        if (!this.room) return;
        const time = this.room.scores.time;
        if (time == null) return;
        this.game.time = Math.floor(time);

        if (this.room.ball.radius != null) {
            this.game.ballRadius = this.room.ball.radius;
        }

        this.game.ticks++;
    }

    public updateDiscxPosition(discIndex: number, xPosition: number): void {
        if (!this.room) return;
        const disc = this.room.discs[discIndex];
        if (disc && disc.x !== xPosition) {
            disc.x = xPosition;
        }
    }

    public updateDiscyPosition(discIndex: number, yPosition: number): void {
        if (!this.room) return;
        const disc = this.room.discs[discIndex];
        if (disc && disc.x !== yPosition) {
            disc.x = yPosition;
        }
    }

    public updateGameTime(room: Room): void {
        if (!room) return;

        const timeLimit: number = room.scores.timeLimit ?? 300;
        this.gameTime = timeLimit !== 0 ? timeLimit / 60 : DefaultGameTime;
    }

    public updatePlayerxPosition(playerId: number, xPosition: number): void {
        if (!this.room) return;
        const playerDisc = this.room.players[playerId];
        if (playerDisc && playerDisc.x !== xPosition) {
            playerDisc.x = xPosition;
        }
    }

    public updatePlayeryPosition(playerId: number, yPosition: number): void {
        if (!this.room) return;
        const playerDisc = this.room.players[playerId];
        if (playerDisc && playerDisc.y !== yPosition) {
            playerDisc.y = yPosition;
        }
    }

    @Event
    onPlayerBallKick(player: Player): void {
        if (!this.active || !this.game || !this.room.discs || !this.room.players) return;

        this.game.rsTouchTeam = player.team;

        if (this.game.rsReady) {
            const players = Array.from(this.room.players.values()).filter(player => player.team !== Teams.Spectators);
            for (const player of players) {
                if (player.invMass?.toFixed(1) !== '0.3') {
                    player.invMass = 0.3;
                }
            };
        }

        if (this.game.rsActive === false && this.game.rsReady === true && (this.game.rsCorner === true || this.game.rsGoalKick === true)) {
            this.game.boosterState = true;
            this.game.rsActive = true;
            this.game.rsReady = false;

            if (this.room.discs.length > 2) {
                this.room.discs[1].x = 2000;
                this.room.discs[1].y = 2000;
                this.room.discs[2].x = 2000;
                this.room.discs[2].y = 2000;
            }
            if (this.room.discs.length > 0) {
                this.room.discs[0].color = 0xffffff;
            }

            this.game.rsTimer = 1000000;
            this.game.warningCount++;

            const playerObj = this.room.players.get(player.id);
            const playerXSpeed = playerObj?.xspeed || 0;
            const playerYSpeed = playerObj?.yspeed || 0;

            if (this.game.rsCorner && this.room.discs[0].y && this.room.discs.length > 0) {
                if (this.room.discs[0].y < 0) {
                    this.room.discs[0].xgravity = playerXSpeed / 35 * -1;
                    this.room.discs[0].ygravity = 0.05;
                } else {
                    this.room.discs[0].xgravity = playerXSpeed / 35 * -1;
                    this.room.discs[0].ygravity = -0.05;
                }
            }

            if (this.game.rsGoalKick && this.room.discs.length > 0) {
                this.room.discs[0].xgravity = 0;
                this.room.discs[0].ygravity = playerYSpeed / 40 * -1;
            }

            this.game.rsCorner = false;
            this.game.rsGoalKick = false;
            this.game.outStatus = "";
        }

        if (this.game.outStatus === "redThrow" || this.game.outStatus === "blueThrow") {
            this.game.throwinKicked = true;
        }
    }
    @Event
    onPlayerTeamChange(_changedPlayer: Player, _byPlayer: Player | null): void {
        if (!this.active || !this.room) return;

        if (this.game.rsActive === false) {
            for (const player of this.room.players.values()) {
                if (player !== undefined) {
                    if (this.game.rsGoalKick || this.game.rsCorner) {
                        player.invMass = 9999999;
                    }
                }
            };
        }
    }

    @Event
    onPositionsReset(): void {
        if (!this.active || !this.room) return;

        if (this.game.lastPlayAnnounced === true) {
            this.room.pause();
            this.game.lastPlayAnnounced = false;
    }}
    @Event
    onGameTick(): void {
        if (!this.active || !this.room) return;
        this.updateGameStatus();
        this.handleBallTouch();
        this.realSoccerRef();
    }
}
