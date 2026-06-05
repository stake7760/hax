<div align="center">

# 🏟️ Arena Vincere

**Sistema profissional de salas HaxBall com bot Discord, cargos persistentes, moderação automatizada, replay upload e clipes em GIF.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white)

**HaxBall** → **Discord** → **SQLite** → **TheHax** → **GIFs automáticos**

</div>

---

## 📚 Sumário

- [Visão Geral](#-visão-geral)
- [Principais Recursos](#-principais-recursos)
- [Hierarquia de Cargos](#-hierarquia-de-cargos)
- [Comandos In-Game](#-comandos-in-game)
- [Sistema de GIFs](#-sistema-de-gifs)
- [Comandos Discord](#-comandos-discord)
- [Configuração](#-configuração)
- [Instalação](#-instalação)
- [Execução](#-execução)
- [Scripts Operacionais](#-scripts-operacionais)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)
- [Observações Operacionais](#-observações-operacionais)

---

## ✨ Visão Geral

Arena Vincere centraliza a operação de uma ou mais salas HaxBall com integração completa ao Discord. O projeto foi desenhado para ambientes competitivos, com permissões por cargo, logs detalhados, webhooks por evento, gravação de partidas e geração automatizada de GIFs dos melhores momentos.

> [!NOTE]
> O projeto separa o `player.admin` nativo do HaxBall dos cargos persistentes do sistema. Isso evita que um admin temporário da sala receba permissões indevidas.

---

## 🚀 Principais Recursos

| Área | Recurso |
|:--|:--|
| 🎮 Salas | Multi-salas HaxBall com configuração por `.env` |
| 🛡️ Permissões | Cargos persistentes por `auth`/IP com hierarquia própria |
| 🤖 Discord | Slash commands, embeds, autocomplete e webhooks |
| 📹 Replays | Upload automático de súmulas para TheHax |
| 🎬 GIFs | Clipes dos últimos segundos da partida enviados ao Discord |
| 🧾 Logs | Entrada, saída, mensagens, bans, kicks e eventos do sistema |
| 🗃️ Persistência | SQLite local para cargos, bans e mutes |
| 🔁 Hot Reload | Reload de módulos, comandos, cogs, clips e helpers sem reiniciar |
| 🌍 Geo/IP | Consulta de IP com proxycheck e fallbacks automáticos |

---

## 🏆 Hierarquia de Cargos

```text
👮‍♂️ Capitão > 💂 Sub-capitão > ⚽ Jogador > 👨‍💼 Administrador > 👑 Admin da sala > Membro comum
```

| Cargo | Descrição |
|:--|:--|
| `👮‍♂️ Capitão` | Maior cargo operacional do sistema |
| `💂 Sub-capitão` | Cargo intermediário com acesso amplo |
| `⚽ Jogador` | Cargo autorizado para comandos de sala |
| `👨‍💼 Administrador` | Cargo persistente menor que jogador |
| `👑 Admin da sala` | `player.admin` nativo do HaxBall |
| `Membro comum` | Jogador sem cargo persistente |

> [!IMPORTANT]
> `player.admin` não é o mesmo que `👨‍💼 Administrador`. O admin nativo da sala não recebe automaticamente permissões de cargo do sistema.

> [!NOTE]
> Cargos persistem no SQLite por `auth`/IP e são obtidos via `!cargo <senha>`.

---

## 🎮 Comandos In-Game

| Comando | Descrição | Acesso |
|:--|:--|:--|
| `!adm` | Vira admin da sala quando não há admin presente | 👤 Todos |
| `!cargo <senha>` | Define cargo persistente por senha | 👤 Todos |
| `!rr` / `!reset` | Reinicia a partida | 👑 Admin / 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!fechar` / `!senha` | Fecha a sala com senha | ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!abrir` | Remove a senha da sala | ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!clearbans` | Limpa bans do HaxBall e banco | 👑 Admin / 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!banall` / `!banred` / `!banblue` / `!banspec` | Bane grupos de jogadores | 👮‍♂️ Cap / 💂 Sub |
| `!kickall` / `!kickred` / `!kickblue` / `!kickspec` | Kicka grupos de jogadores | 👮‍♂️ Cap / 💂 Sub |
| `!mute` / `!unmute` | Muta ou desmuta jogador | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!camp` / `!firmo` | Ativa campeonato e confirma presença | 👮‍♂️ Cap / 💂 Sub / ⚽ Jog |
| `!swap` | Troca times entre red, blue e spec | 👑 Admin / 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!radius` | Altera o raio de um jogador | 💂 Sub / 👮‍♂️ Cap |
| `!puxarbola` / `!pararbola` / `!tp` | Controle avançado da bola | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!chaton` / `!chatoff` | Liga/desliga chat de jogadores | ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!specon` / `!specoff` | Liga/desliga chat de espectadores | ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!uniform` | Altera uniforme do time | 👑 Admin / 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!avatar` | Altera avatar de jogador | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!pv` / `!t` | Mensagem privada ou chat de time | 👤 Todos |
| `!afk` / `!afks` | Marca AFK ou lista AFKs | 👤 Todos |
| `!bb` / `!leave` | Sai da sala | 👤 Todos |
| `!help` | Mostra comandos disponíveis | 👤 Todos |
| `!gif` / `!clip` / `!gravar` / `!replay` | Gera GIF dos últimos segundos | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!x3` / `!x4` / `!x3fbf` / `!x4fbf` / `!lvk` / `!rs` / `!penal` | Troca o mapa | 👑 Admin / 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!hackban` | Bane jogador por ID | 👮‍♂️ Cap |
| `!hackclearbans` | Limpa bans do banco | 👮‍♂️ Cap |
| `!eval` | Executa JavaScript | 👮‍♂️ Cap |

> [!WARNING]
> Comandos sensíveis como `!cargo` e `!senha` têm credenciais mascaradas nos logs.

---

## 🎬 Sistema de GIFs

O comando `!gif` gera um GIF dos últimos segundos da partida e envia automaticamente no Discord via `GIFS_WEBHOOK`.

### Regras

| Regra | Valor |
|:--|:--|
| Acesso | `👮‍♂️ Capitão`, `💂 Sub-capitão`, `⚽ Jogador`, `👨‍💼 Administrador` |
| Duração permitida | `1` a `10` segundos |
| Duração padrão | `5s` |
| Limite por partida | `4` GIFs |
| Envio | Discord via `GIFS_WEBHOOK` |
| Pós-envio | GIF local apagado após upload bem-sucedido |
| Falha no envio | Arquivo local permanece em `clips/` |

> [!NOTE]
> Se a partida tiver menos tempo que o pedido, o GIF usa apenas o tempo disponível.

> [!IMPORTANT]
> O replay temporário `.hbr2` usado para renderizar os clipes é apagado após todos os clips da partida serem enviados.

Replays completos e súmulas só são enviados quando a partida possui:

- pelo menos um gol;
- mais de `30s` de tempo jogado;
- menos de `30min` de duração.

### Exemplos

```text
!gif
!gif 5
!clip 10 gola bonito
!replay 3 defesa final
```

O embed enviado no Discord inclui:

- sala;
- duração;
- solicitante;
- comentário;
- GIF anexado.

---

## 🤖 Comandos Discord

Os comandos slash controlam a sala diretamente pelo Discord.

| Comando | Função |
|:--|:--|
| `/admin` | Dá ou remove admin nativo da sala |
| `/avatar` | Altera avatar de jogador |
| `/banir` | Bane jogador |
| `/kickar` | Kicka jogador |
| `/mutar` / `/desmutar` | Muta ou desmuta jogador |
| `/players` | Lista jogadores da sala |
| `/time` | Move jogador de time |
| `/radius` | Altera raio de jogador |
| `/mensagem geral` | Envia mensagem para a sala |
| `/mensagem time` | Envia mensagem para um time |
| `/mensagem privada` | Envia PV para jogador |
| `/mapa` | Carrega mapa por arquivo `.hbs` ou `.json` |
| `/senha` | Altera senha da sala |
| `/iniciar` / `/parar` / `/pausar` / `/despausar` / `/reiniciar` | Controle de partida |
| `/limparbans` | Limpa bans |
| `/kickrate` | Ajusta kickrate |
| `/uniforme` | Altera uniforme |

### Autocomplete

O campo `sala` recebe automaticamente as salas ativas.

Nos comandos com campo `player`, após selecionar a sala, o Discord sugere os jogadores daquela sala no formato:

```text
[id] nome
```

Assim você escolhe o jogador diretamente na lista, sem precisar usar `/players` antes.

---

## ⚙️ Configuração

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

### Variáveis principais

```env
TOKEN_BOT=
CLIENT_ID=
GUILD_ID=

ROOM1_TOKEN=
ROOM1_NAME=
ROOM1_PUBLIC=true

CAP=
SUBCAP=
JOGADOR=
ADMIN=
SENHA_PADRAO=vncpass

ADMIN_WEBHOOK=
CONFIRMACAO_WEBHOOK=
ENTRADA_WEBHOOK=
SAIDA_WEBHOOK=
MENSAGEM_WEBHOOK=
GRAVACAO_WEBHOOK=
GIFS_WEBHOOK=
SENHA_WEBHOOK=

THEHAX_TENANT=
THEHAX_APIKEY=
PROXYCHECK_API_KEY=
CHROMIUM_PATH=
```

> [!WARNING]
> Webhooks, tokens e API keys são credenciais. Não publique valores reais em commits, issues, prints ou logs públicos.

---

## 📦 Instalação

```bash
npm install
```

> [!NOTE]
> O `npm install` executa automaticamente o `postinstall`, responsável por aplicar patches em dependências necessárias para multi-salas e isolamento de handlers.

---

## ▶️ Execução

Iniciar o sistema:

```bash
npm run start
```

Build TypeScript:

```bash
npm run build
```

---

## 🛠️ Scripts Operacionais

### Patch do HaxBall

O projeto aplica patches em dependências instaladas para manter:

- multi-salas na `haxball.js`;
- handlers isolados por sala no `haxball-extended-room`.

O patch roda automaticamente no `npm install` via `postinstall`.

Para reaplicar manualmente:

```bash
npm run postinstall
```

ou:

```bash
node scripts/patch-haxball.js
```

Use isso depois de reinstalar `node_modules`, atualizar dependências ou suspeitar de erro como `Can't init twice`.

### Sync com VPS

O sync envia o código local para `/home/<VPS_USER>/vincere`, preservando arquivos operacionais da VPS:

- `.env`;
- `data.db*`;
- `node_modules/`;
- `clips/`;
- `.git/`;
- `README.md`.

Configure no PowerShell:

```powershell
$env:VPS_USER="ubuntu"
$env:VPS_HOST="IP_OU_DOMINIO_DA_VPS"
$env:VPS_KEY="C:\caminho\para\sua-chave.ppk"
```

> [!NOTE]
> `VPS_KEY` é opcional se o SSH já encontrar a chave sozinho. Chaves `.ppk` usam `pscp/plink`; chaves OpenSSH usam `scp/ssh`.

Enviar somente o código:

```powershell
npm.cmd run sync
```

Enviar código e rodar `npm install` na VPS:

```powershell
npm.cmd run sync:full
```

Se a VPS não tiver `pm2`, o script apenas avisa. Nesse caso, reinicie manualmente na sessão `tmux`:

```bash
tmux attach -t Vincere
npm run start
```

---

## 🧱 Estrutura do Projeto

```text
src/
  clip/        Renderização e envio de GIFs
  config/      Leitura de variáveis de ambiente
  database/    SQLite
  discord/     Bot e comandos slash
  haxball/     Comandos e módulos in-game
  room/        Inicialização e gerenciamento de salas
  utils/       Helpers
maps/          Mapas HaxBall
clips/         Replays e GIFs temporários
```

---

## 🗃️ Banco de Dados

O SQLite armazena:

- cargos persistentes;
- bans;
- mutes.

Arquivo padrão:

```text
data.db
```

> [!IMPORTANT]
> A fila de clips fica em memória. O banco não armazena histórico de GIFs enviados.

---

## 📌 Observações Operacionais

- Reinicie o bot após alterar `.env`.
- Webhooks são credenciais; não publique URLs reais.
- `clips/` é diretório operacional e não deve ser versionado.
- Use `npm run build` antes de subir alterações.

---

<div align="center">

**Arena Vincere**

Operação HaxBall com automação, controle e rastreabilidade.

</div>
