import { ChatSounds, ChatStyle, Colors, Module, type Player, type Room, Teams, Event } from "haxball-extended-room";
import FormData from "form-data";
import { request } from "undici";
import { currentStadiumName } from "./Stadium";
import { client } from "../../discord/Client";
import { getBotName, getBotURL } from "../../discord/EmbedFactory";
import { getWebhookUrl } from "../../config/env";
import { clipQueue } from "../../clip/Queue";
import { sendWebhookJson, webhookJsonPayload } from "../../utils/discordWebhook";
import fs from "node:fs";
import path from "node:path";

const MIN_REPLAY_SECONDS = 30;
const MAX_REPLAY_SECONDS = 30 * 60;

function pointDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function uploadReplayToTheHax(recording: Uint8Array, roomName: string, callback: (result: string | null) => void) {
  const tenant = process.env.THEHAX_TENANT;
  const apiKey = process.env.THEHAX_APIKEY;
  if (!tenant || !apiKey) return callback(null);

  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(/,/g, "").replace(/\//g, "-").replace(/ /g, "-");
  const form = new FormData();
  form.append("replay[name]", `${roomName} - ${agora}`);
  form.append("replay[private]", "false");
  form.append("replay[fileContent]", recording.toString());

  const tryUpload = (attempt: number) => {
    request("https://replay.thehax.pl/api/upload", {
      method: "POST", headers: { ...form.getHeaders(), "API-Tenant": tenant, "API-Key": apiKey }, body: form,
    })
      .then((r) => r.body.json())
      .then((result: any) => {
        if (result.success && result.url) return callback(result.url);
        if ([401, 422].includes(result.code)) return callback(null);
        if ([429, 500].includes(result.code) && attempt < 3) setTimeout(() => tryUpload(attempt + 1), attempt * 1000);
        else callback(null);
      })
      .catch(() => { if (attempt < 3) setTimeout(() => tryUpload(attempt + 1), attempt * 1000); else callback(null); });
  };
  tryUpload(1);
}

@Module
export class GoalsModule {
  private isRecording = false;
  private hasGameStarted = false;
  private goals: { time: string; scorer: string; assister: string | null; isOwnGoal: boolean; teamEmoji: string }[] = [];
  private redScore = 0;
  private blueScore = 0;
  private gameTime = "00:00";
  private scorer: Player | null = null;
  private assister: Player | null = null;
  private playersThatTouchedTheBall = new Set<number>();
  private lastBallPosition: { x: number; y: number } | null = null;
  private lastBallSpeed = 0;
  private lastTouchByPlayer: number | null = null;

  constructor(private room: Room) {
    this.room.onTeamVictory = (scores) => this.handleTeamVictory(scores);
    this.room.onTeamGoal = (team) => this.handleTeamGoal(team);
    this.room.onPlayerBallKick = (player) => { this.trackScorer(player); };
    this.room.onGameTick = () => this.handleTick();
  }

  private trackScorer(player: Player): void {
    if (!this.scorer) { this.scorer = player; return; }
    if (this.scorer.id !== player.id && player.team === this.scorer.team) { this.assister = this.scorer; this.scorer = player; return; }
    if (this.scorer.id !== player.id) { this.scorer = player; this.assister = null; }
  }

  private handleTick(): void {
    if (!this.room.scores) return;
    if (!this.isRecording && this.room.scores.time > 0) {
      this.isRecording = true;
      this.room.startRecording();
      this.room.send({ message: "🎥 A partida está sendo gravada.", color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    }
    this.updateScores(this.room.scores);
    this.trackBall();
  }

  private isOwnGoal(goalTeam: number, scorer: Player): boolean {
    if (scorer.team === 0) return false;
    return goalTeam !== scorer.team;
  }

  private handleTeamGoal(team: number): void {
    if (!this.scorer && this.lastTouchByPlayer !== null) {
      const p = Array.from(this.room.players.values()).find((pl) => pl.id === this.lastTouchByPlayer);
      if (p) this.scorer = p;
    }
    if (team === Teams.Red) this.redScore++;
    if (team === Teams.Blue) this.blueScore++;

    const scorer = this.scorer;
    const ownGoal = scorer ? this.isOwnGoal(team, scorer) : false;
    const teamEmoji = team === 1 ? "🔴" : "🔵";
    const scorerName = scorer?.name ?? "Desconhecido";
    const validAssister = scorer && this.assister && this.assister.team === scorer.team ? this.assister.name : null;

    this.goals.push({ time: this.gameTime, scorer: scorerName, assister: validAssister, isOwnGoal: ownGoal, teamEmoji });

    const speedText = this.lastBallSpeed ? ` Velocidade: ${this.lastBallSpeed.toFixed(2)}km/h` : "";
    let msg: string;
    if (!scorer) msg = `[${this.gameTime}] ⚽ Gol do time ${teamEmoji}.${speedText}`;
    else if (ownGoal) msg = `[${this.gameTime}] 🤣 Gol contra de ${teamEmoji} ${scorer.name}.${speedText}`;
    else msg = `[${this.gameTime}] ⚽ Gol de ${scorer.name}!${validAssister ? ` 🅰️ (assistência de ${validAssister})` : ""}${speedText}`;

    this.room.send({ message: msg, color: team === 1 ? Colors.PaleVioletRed : Colors.LightBlue, style: ChatStyle.Bold, sound: ChatSounds.Notification });

    const msgUrl = getWebhookUrl("MENSAGEM_WEBHOOK", (this.room.state as any).roomNumber);
    if (msgUrl) sendWebhookJson(msgUrl, { content: `[${this.room.name}] ${msg}` });

    this.scorer = null;
    this.assister = null;
    this.resetTouchTracking();
  }

  private handleTeamVictory(scores: { red: number; blue: number }): void {
    this.redScore = scores.red;
    this.blueScore = scores.blue;
    const winner = scores.red > scores.blue ? "red" : "blue";
    const ws = winner === "red" ? scores.red : scores.blue;
    const ls = winner === "red" ? scores.blue : scores.red;
    this.room.send({ message: `🥇 O time ${winner} venceu por ${ws}-${ls}!`, color: winner === "red" ? Colors.PaleVioletRed : Colors.LightBlue, style: ChatStyle.Bold, sound: ChatSounds.Notification });
  }

  @Event
  onGameStart(): void {
    this.hasGameStarted = true;
    this.isRecording = false;
    this.goals = [];
    this.scorer = null;
    this.assister = null;
    this.resetTouchTracking();
  }

  @Event
  onGameStop(): void {
    this.hasGameStarted = false;
    if (this.isRecording) {
      if (this.room.scores) {
        this.redScore = Math.max(this.redScore, this.room.scores.red);
        this.blueScore = Math.max(this.blueScore, this.room.scores.blue);
        this.gameTime = formatClock(this.room.scores.time);
      }

      const gameSeconds = this.room.scores?.time ?? clockToSeconds(this.gameTime);
      const rec = this.room.stopRecording();
      const gameTimeSnapshot = formatClock(gameSeconds);
      const goalsSnapshot = this.goals.map((goal) => ({ ...goal }));
      const redScoreSnapshot = this.redScore;
      const blueScoreSnapshot = this.blueScore;
      const redPlayersSnapshot = Array.from(this.room.players.red().values()).map((p) => `🔴 ${p.name}`);
      const bluePlayersSnapshot = Array.from(this.room.players.blue().values()).map((p) => `🔵 ${p.name}`);
      const specPlayersSnapshot = Array.from(this.room.players.spectators().values()).map((p) => `🟢 ${p.name}`);
      const stadiumSnapshot = (this.room.state as any).currentStadiumName || currentStadiumName;
      const fileName = this.createReplayFileName();
      const pendingClips = clipQueue.countPending(this.room.name);
      const shouldSaveReplay = goalsSnapshot.length > 0 && gameSeconds > MIN_REPLAY_SECONDS && gameSeconds < MAX_REPLAY_SECONDS;
      let replayPath: string | undefined;

      if (pendingClips > 0) {
        const clipsDir = path.resolve(__dirname, "../../../clips");
        if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });
        replayPath = path.join(clipsDir, fileName);
        fs.writeFileSync(replayPath, Buffer.from(rec));
      }

      if (shouldSaveReplay) {
        const webhookUrl = getWebhookUrl("GRAVACAO_WEBHOOK", (this.room.state as any).roomNumber);
        if (webhookUrl) {
          uploadReplayToTheHax(rec, this.room.name, (theHaxUrl) => {
            if (theHaxUrl) {
              this.room.send({ message: `🎥 Replay enviado: ${theHaxUrl}`, color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
            } else {
              this.room.send({ message: "🎥 A gravação foi enviada.", color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
            }
            const theHaxEmoji = client.emojis.cache.find((e) => e.name === "TheHax");
            const theHaxPrefix = theHaxEmoji ? `${theHaxEmoji} ` : "";

            const embed = {
              title: `📝 \`SÚMULA DA PARTIDA\` - ${this.room.name}`,
              color: redScoreSnapshot > blueScoreSnapshot ? Colors.Red : blueScoreSnapshot > redScoreSnapshot ? Colors.LightBlue : Colors.LightGreen,
              fields: [
                { name: `🔴 \`RED\` (${redScoreSnapshot})`, value: redPlayersSnapshot.join("\n") || "ㅤ", inline: true },
                { name: "🟢 \`SPEC\`", value: specPlayersSnapshot.join("\n") || "ㅤ", inline: true },
                { name: `🔵 \`BLUE\` (${blueScoreSnapshot})`, value: bluePlayersSnapshot.join("\n") || "ㅤ", inline: true },
                { name: "⏳ \`Tempo de Jogo\`", value: gameTimeSnapshot, inline: true },
                { name: "🗺️ \`Mapa\`", value: stadiumSnapshot, inline: true },
                { name: "📁 \`Nome do Replay\`", value: `\`\`\`fix\n${fileName}\`\`\``, inline: false },
                { name: "📊 \`Estatísticas\`", value: goalsSnapshot.map((g) => `⏱️ **[${g.time}]** - ${g.teamEmoji} ${g.isOwnGoal ? `Gol contra de \`${g.scorer}\`` : `Gol de \`${g.scorer}\`${g.assister ? ` 🅰️ Assistência de \`${g.assister}\`` : ""}`}`).join("\n"), inline: false },
                ...(theHaxUrl ? [{ name: `${theHaxPrefix}\`Link do Replay\``, value: `[Clique aqui para abrir](${theHaxUrl})`, inline: false }] : []),
              ],
              footer: { text: `${new Date().getFullYear()} © ${getBotName()} - Todos os direitos reservados`, icon_url: getBotURL() },
            };
            const form = new FormData();
            form.append("payload_json", JSON.stringify(webhookJsonPayload({ embeds: [embed] })));
            form.append("file", Buffer.from(rec), fileName);
            request(webhookUrl, { method: "POST", headers: form.getHeaders(), body: form }).catch(() => {});
            if (replayPath && theHaxUrl) {
              const clipQueueState = clipQueue as unknown as { __replayUrls?: Map<string, string> };
              if (!clipQueueState.__replayUrls) clipQueueState.__replayUrls = new Map<string, string>();
              clipQueueState.__replayUrls.set(replayPath, theHaxUrl);
            }
            if (replayPath) void clipQueue.processPending(replayPath, this.room.name);
          });
        } else {
          this.room.send({ message: "🎥 A gravação foi enviada.", color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
          if (replayPath) void clipQueue.processPending(replayPath, this.room.name);
        }
      } else if (replayPath) {
        void clipQueue.processPending(replayPath, this.room.name);
      }
    }
    this.isRecording = false;
    this.scorer = null;
    this.assister = null;
    this.resetTouchTracking();
  }

  private createReplayFileName(): string {
    const parts = getSaoPauloDateParts();
    const dd = parts.day;
    const mm = parts.month;
    const yyyy = parts.year;
    const hh = parts.hour;
    const min = parts.minute;
    const ss = parts.second;
    return `HBReplay-${dd}-${mm}-${yyyy}-${hh}h${min}m${ss}s.hbr2`;
  }

  private updateScores(scores: { red: number; blue: number; time: number }): void {
    this.redScore = scores.red;
    this.blueScore = scores.blue;
    const m = Math.floor(scores.time / 60).toString().padStart(2, "0");
    const s = Math.floor(scores.time % 60).toString().padStart(2, "0");
    this.gameTime = `${m}:${s}`;
  }

  private trackBall(): void {
    if (this.room.ball.x == null || this.room.ball.y == null) return;
    const pos = { x: this.room.ball.x, y: this.room.ball.y };
    if (this.lastBallPosition) this.lastBallSpeed = (pointDistance(pos, this.lastBallPosition) * 60 * 60 * 60) / 15000;
    this.lastBallPosition = pos;
    for (const p of this.room.players.values()) {
      if (!p.position) continue;
      if (!this.playersThatTouchedTheBall.has(p.id) && pointDistance(p.position, pos) < 25.01) {
        this.playersThatTouchedTheBall.add(p.id);
        this.lastTouchByPlayer = p.id;
      } else if (this.playersThatTouchedTheBall.has(p.id) && pointDistance(p.position, pos) > 29.01) {
        this.playersThatTouchedTheBall.delete(p.id);
      }
    }
  }

  private resetTouchTracking(): void {
    this.playersThatTouchedTheBall.clear();
    this.lastTouchByPlayer = null;
    this.lastBallPosition = null;
    this.lastBallSpeed = 0;
  }
}

function clockToSeconds(value: string): number {
  const [minutes, seconds] = value.split(":").map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
  return minutes * 60 + seconds;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getSaoPauloDateParts(): Record<"day" | "month" | "year" | "hour" | "minute" | "second", string> {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value])) as Record<"day" | "month" | "year" | "hour" | "minute" | "second", string>;
}
