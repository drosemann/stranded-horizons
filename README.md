# Stranded Horizons

> Leichtgewichtiges Browser Survival Game – Vanilla HTML, CSS, JavaScript. Ohne Backend, ohne Build-Step.

Entstanden am 08.04.2025 – first commit `3a668c7` mit 18 Dateien. Im ersten Draft hieß die Idee noch viel größer – `PROJECT-IDEA` mit Character Creation, Builder/Scout/Medic/Engineer, Stamina & Co. Am Ende wurde es ein fokussiertes Wave-Survival.

### Entstehung

Ich wollte schon immer ein (Browser) Spiel bauen, vor allem RPG. Hatte nie die Zeit, jetzt noch weniger um kreativ zu sein. Das ist das einzige Projekt wo ich Auto-Deploys zu Vercel habe – Free Tier wird um Weltjahre nicht ausgelastet. Nur Hater die nie was probieren sagen da was, um nie etwas proven zu müssen xD.

Ursprünglich als Multiplayer Survival auf einer Insel geplant, jetzt als Singleplayer Wave-Shooter umgesetzt – ideal um Vanilla JS Game-Loop zu lernen.

### Was ist das?

Du steuerst einen Survivor, wehrst Wellen ab, sammelst Coins und kaufst Upgrades. HTML5 Canvas, Echtzeit Game-Loop.

**Features:**
- Pure Front-End – kein Framework, kein Build
- Canvas Rendering + Game-Loop
- WASD / Pfeiltasten + Maus Aim/Shoot
- Wave Spawning
- Shop für Speed & Damage Upgrades
- Highscore in `localStorage`

### Installation

**Option 1: Git**
```bash
git clone <repo-url>
cd stranded-horizons
```

**Option 2:** ZIP downloaden und entpacken.

### Nutzung

`index.html` im Browser öffnen, **Play Now** klicken.

Für Dev besser mit static Server:
```bash
python3 -m http.server 8000
# -> http://localhost:8000
```

### Konfiguration

Alle Balancing Werte direkt in `game.js`:
- `health`, `speed`, `damage`
- Enemy Spawn Intervall
- Upgrade Preise

Wenn du Assets verschiebst, Pfade in `game.js` + `index.html` anpassen.

### Repo Struktur

- `index.html` – Landing
- `game.html` – Game Screen
- `game.js` – Logik
- `assets/` – Bilder
- `devlog/` – Screenshots & Notizen

### Zukunft – Loop Engineering Experiment

Ich will hier bald mein KVM-Konzept anwenden – mein Ubuntu Cloud VPS als Hypervisor:

- **VM1 Worker** – 3 Git Worktrees + OpenCode/Puppeteer Agents (UI/Audio, Gameplay, Balancing)
- **VM2 Production** – NGINX, hosted Game
- **VM3 Management** – FastAPI Dashboard mit `STATUS.md` Feedback Loop, CI_SUCCESS/FAILURE Handling, Merge Konflikte

Ziel: Ein 24/7 Loop der das Vanilla JS Spiel selbst weiterentwickelt – quasi Auto-Dev für ein Browser Game. Gespannt sein ^^

### Troubleshooting

- **Schwarzer Screen**: JS aktiviert? Asset Pfade prüfen
- **Kein Input**: Auf Canvas klicken für Fokus
- **Assets laden nicht**: Dateinamen in `assets/` exakt wie in `game.js`
- **Local File Block**: Statt Doppelklick `http.server` nutzen

### Lizenz

GNU GPLv3 – siehe [LICENSE](LICENSE).

### Ziel: stranded-horizons v2 - Persistent One World F2P

*Core Loop:* Jeder Spieler hat einen festen Chunk für immer. Je weiter vom Zentrum, desto schlechter die Fabrik (deine Idee). Fraktionen können Chunks verbinden. Admin kann live eingreifen und MC Welten importieren.

---

## Phase 0 - Fundament (1-2 Wochen)

*Was du jetzt hast:* 18 files vanilla JS + Vercel Auto-Deploy

*Was du änderst:*

1. *Trenne Frontend und Simulation*
   - `client/` bleibt vanilla JS + Canvas, bleibt auf Vercel
   - `server/` neu: Node.js + Express + Socket.io, läuft auf deinem KVM (nicht Vercel, zu teuer für WebSockets)
   - `db/` MariaDB: Tabelle `bases (id, owner, x, y, efficiency, blueprint_json)`

2. *Eine Welt Regel*
   - Welt = 20000x20000 virtuelle Einheiten, aufgeteilt in 100x100 Chunks
   - Beim ersten Login: Server sucht freien Chunk mit deiner streuland Logik (kein Grid, random verteilt, Wege dazwischen)
   - Der Chunk wird für immer in DB gespeichert, selbst wenn Spieler nie wieder kommt

## Phase 1 - Effizienz System + Fester Platz (deine Kern Idee)

*Formel:*

```text
distanz = sqrt(x² + y²)
effizienz = max(30, 100 - (distanz / 200))  // 200 Einheiten = 1% Verlust
```

- Zentrum 0,0 = 100%
- Rand 7000 = 30%
- In UI: Chunk Farbe wird blasser je schlechter

*Fraktion Bonus:*
Wenn 2 Basen verbunden sind (du klickst "Verbinden", beide bestätigen), kriegen beide +10% Effizienz, max 100%. Das pusht Zusammenhalt.

*Code Snippet für Server:*

```js
// server/world.js
function getEfficiency(x, y) {
  const d = Math.hypot(x, y);
  return Math.max(30, 100 - d * 0.005);
}
```

## Phase 2 - Fabriken statt Survival

Weg von Hunger/HP, hin zu Factorio Light im Browser.

- Jeder Chunk hat 20x20 Bau-Grid
- Gebäude: Mine (produziert), Förderband, Fabrik, Mauer, Turm
- Alles wird server-authoritative gerechnet alle 2 Sekunden, nicht im Client
- Client schickt nur: `socket.emit('place', { type, x, y })`, Server prüft Ressourcen und antwortet

Das killt Cheating im Web.

## Phase 3 - Admin Modus (dein Wunsch)

*Nicht ins Spiel bauen, separates Panel.*

Du hast schon `management-panel :5173/:3001`, nimm das gleiche:

- Route `/admin/world`
- Live Map mit Leaflet.js (Open Source, wie Minecraft Map)
- Klick auf Chunk: Edit JSON, platziere Struktur, setze Effizienz manuell
- Button "Welt Event": platziere z.B. 10 Bunker Ruinen in alten Chunks für Content

Backend: Admin Panel schreibt in MariaDB + `redis.publish('chunk:update', chunkId)`, alle Worker die den Chunk haben laden neu.

*Shortcut wie in ed-docs:* Admin drückt im Spiel `:` und hat Konsole `:tp 0 0`, `:give iron 100`, `:place bunker`.

## Phase 4 - Minecraft Import (dein Killer Feature)

Das macht kein anderes Web Game.

*Pipeline:*

1. *Upload:* Admin lädt `.schematic` / `.schem` oder ganzen `region/` Ordner im Admin Panel hoch
2. *Parser:* Python Service (dein Python Fokus) mit `mca` + `amulet` liest Blöcke
3. *Mapping Tabelle* `mc_to_sh.json`:

```json
{
  "minecraft:stone": "sh:metal_wall",
  "minecraft:iron_block": "sh:factory_t1",
  "minecraft:chest": "sh:loot_container",
  "minecraft:spawner": "sh:enemy_spawner"
}
```

4. *Transform:* Skript erstellt daraus dein Basis Blueprint JSON
5. *Place:* Im Admin Panel Vorschau, dann in Welt setzen als Dungeon/Ruine

Damit kannst du 1000 SpigotMC Maps aus deiner MineHub Zeit importieren. Unendlich Content ohne selbst zu bauen.

## Phase 5 - Hosting + Scale (dein infra-pilot Endgame)

- Jeder 1000x1000 Bereich = ein Docker Container = ein Worker
- infra-pilot startet automatisch neuen Worker wenn Bereich >80% voll
- Vercel Frontend bleibt, aber WebSocket geht direkt zu `ws.shadowunity.de` auf deinen KVM
- Monitoring mit HetrixTools wie du es eh hast

*Monetarisierung F2P ohne Pay2Win:*
- Basis kostenlos
- 2. Basis Slot: 3€ einmalig
- Cosmetics für Basis Skin
- Effizienz Booster am Rand: 2€ für 7 Tage, aber nie über 100%

### Reihenfolge zum Starten:

1. Heute: Lege `server/` Ordner in stranded-horizons Repo an, Express + Socket.io + MariaDB connect
2. Diese Woche: Feste Chunk Vergabe + Effizienz Formel implementieren
3. Nächste Woche: Admin Panel von infra-pilot kopieren und als `/admin` wiederverwenden
4. Danach: MC Import Python Skript