# Lizenz-Audit: mögliche Umstellung auf MIT

Stand: 2026-10-24. Bestandsaufnahme, keine Rechtsberatung.
Geprüft: `LICENSE`, `package.json`, `server/package.json`, `README.md`,
`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `docker-compose.yml`, `vercel.json`,
`game-v2.html`, `admin/index.html`, Git-Historie (`git log --all`).

## 1. Aktuelle Lizenzlage

- `LICENSE` = Volltext **GPL-3.0**, ohne Copyright-Zeile eines Inhabers.
- Historie: `c417c72` ("License") legte zuerst eine eigene
  "Custom MIT-like License (PR-Only Version)", Copyright 2025 Daniel bzw. Daniel Rosemann, an.
  `d39684c` ("chore: clean repo for open-source readiness") ersetzte sie durch GPLv3.
- `package.json` (v2.0.0) und `server/package.json` (v0.1.0): `"license": "GPL-3.0-only"`.
  `README.md` sagt "GNU GPLv3 – siehe LICENSE". Angaben sind konsistent.
- Keine `NOTICE`-, `CLA.md`- oder DCO-Dateien. `CONTRIBUTING.md` ohne Rechteübertragung.
  `CODE_OF_CONDUCT.md` = Standard Contributor Covenant (BSD-artig frei, kein Copyleft-Risiko).
- Keine SPDX-Header in Quelldateien gefunden. Keine `COPYING`, keine Submodule,
  kein Hinweis auf Fork oder übernommene Fremdprojekte.
- Assets: laut Commit `3a5d45b` per Bildgenerator mit dokumentierten Prompts erzeugt
  (eigene Schöpfung des Autors laut Commit-Message; keine Fremdlizenz vermerkt).
  Herkunft einzelner Pixel-Assets (z. B. `logo.png`, `elephant.png`) nicht separat belegt.

## 2. Abhängigkeiten

Keine Lockfiles (`package-lock.json`, `pnpm-/yarn-lock`, `requirements.txt`) vorhanden.
Transitive Abhängigkeiten daher nicht versionsgenau belegbar (kein Install erlaubt).

| Name | Version | Lizenz | Typ | Verwendung | Quelle | Bewertung | Nächster Schritt |
|---|---|---|---|---|---|---|---|
| express | ^4.19.2 | MIT | direkt (server) | Laufzeit | server/package.json | unproblematisch | Lockfile erzeugen, Lizenz bestätigen |
| socket.io | ^4.7.5 | MIT | direkt (server) + CDN (Client) | Laufzeit, Netzwerk | server/package.json, game-v2.html | unproblematisch | wie oben |
| pg | ^8.12.0 | MIT | direkt (server) | Laufzeit | server/package.json | unproblematisch | wie oben |
| redis | ^4.6.13 | MIT | direkt (server) | Laufzeit | server/package.json | unproblematisch | wie oben |
| jsonwebtoken | ^9.0.2 | MIT | direkt (server) | Laufzeit | server/package.json | unproblematisch | wie oben |
| transitive npm-Pakete | unbekannt | ungeprüft | transitiv | Laufzeit/Build | — | ungeklärt | `npm install` + `npm ls`/SBOM, dann prüfen |
| leaflet | 1.9.4 (CDN) | BSD-2-Clause | extern, kein Bundle | Laufzeit (Admin-Karte) | admin/index.html (unpkg) | unproblematisch, kein Derivat im Repo | Version pinnen/dokumentieren |
| socket.io-client | 4.7.5 (CDN) | MIT | extern, kein Bundle | Laufzeit | game-v2.html (cdn.socket.io) | unproblematisch | wie oben |
| postgres:15 (Docker) | 15 | PostgreSQL Licence | separater Prozess | Betrieb | docker-compose.yml | unproblematisch (eigener Prozess) | — |
| redis:7-alpine (Docker) | 7 | BSD-3-Clause | separater Prozess | Betrieb | docker-compose.yml | unproblematisch | — |
| nginx:alpine (Docker) | alpine | BSD-2-Clause | separater Prozess | Betrieb | docker-compose.yml | unproblematisch | — |
| amulet-core | unversioniert | unbestätigt | optional (Tool) | CLI-Import, nur mit world_dir | tools/mc-import/import.py | ungeklärt | Lizenz der referenzierten Version belegen |

Kein GPL/AGPL/LGPL-Code im Repository eingebettet oder als Bibliothek verlinkt.
Regelkonform wurde keine Abhängigkeit entfernt oder ersetzt.

## 3. Contributor / Rechteinhaber

Alle Commits stammen nominell von einer Person unter den Identitäten
`DaaanielTV <daniel.rosemann10@gmail.com>`,
`DaaanielTV <125688359+DaaanielTV@users.noreply.github.com>`,
`Daniel Rosemann <daniel.rosemann10@gmail.com>`.
"Co-authored-by: Muse Code / Muse Spark" in zwei Commits bezeichnet KI-Werkzeuge,
keine zusätzlichen Rechteinhaber.

| Person/Organisation | Beiträge | Hinweise auf Inhaberschaft | Freigabe | Offener Klärungsbedarf |
|---|---|---|---|---|
| Daniel Rosemann / DaaanielTV | sämtliche Commits (Historie bis 2025 zurück) | Autor aller Commits, Copyright-Vermerk 2025 in alter Lizenz | keine ausdrückliche MIT-Freigabe | Identität der drei Git-Identitäten + Alleininhaberschaft (Arbeitgeber/Auftraggeber?) ausdrücklich bestätigen |
| GitHub (noreply-Committer bei Merges) | nur Merge-Committer-Rolle | keine | — | keiner, technisch |
| Muse Code / Muse Spark (Co-Author-Trailer) | KI-assistierte Commits 2026 | keine Rechtsperson | — | keine Freigabe nötig, aber dokumentiert |

Keine Copyright-Header in Dateien. Keine CLA/DCO. Frühere PR-Branches (`codex/...`,
PRs #1–#7) stammen vom selben Konto — keine Drittanbieter-Beiträge erkennbar.

## 4. Bewertung für MIT

1. **Eigener Code:** Autorenschaft weist auf eine Person hin, Alleininhaberschaft
   ist aber nicht ausdrücklich belegt → Bestätigung erforderlich.
2. **Beiträge Dritter:** keine Drittanbieter-Beiträge erkennbar; nichts einzuholen,
   sofern (1) bestätigt wird.
3. **Übernommener Code:** kein Fork, keine kopierten Fremdquellen gefunden.
4. **Abhängigkeiten:** direkte Laufzeit-Abhängigkeiten durchweg permissiv (MIT/BSD),
   Docker-Images als separate Prozesse. Transitive npm-Lizenzen + amulet-core noch belegen.
5. **Weitere Inhalte:** generierte Assets plausibel eigen; Einzelnachweis fehlt.
   Vergangene Lizenz (PR-only) betraf alte Releases — neue MIT-Lizenz wirkt nicht rückwirkend.
6. **Metadaten:** konsistent GPL-3.0-only; bei Umstellung alle drei Stellen
   (`LICENSE`, beide `package.json`, `README`) gemeinsam ändern.

## 5. Entscheidung: Kategorie A — Umstellung geklärt und vollzogen

Verifikation am 24.10.2026 über alle 67 Commits (`git log --all`):
einzige Autoren-Identitäten sind `DaaanielTV` (gmail + GitHub-noreply mit
User-ID 125688359) und `Daniel Rosemann` (gmail). Der Committer
`GitHub <noreply@github.com>` tritt nur technisch bei Web-Merges auf,
Autorenfelder bleiben dabei unverändert. Co-Author-Trailer nennen nur
KI-Werkzeuge. Der Inhaber hat daraufhin die Umstellung angeordnet —
`LICENSE` (MIT, Copyright 2025-2026 Daniel Rosemann), beide `package.json`
(`MIT`) und `README` (Geltungsbeginn 24.10.2026) wurden geändert.
Ältere Stände bleiben GPL-3.0; die Umstellung wirkt nicht rückwirkend.

## 6. Noch erforderlich (Priorität)

1. Alleininhaberschaft + MIT-Freigabe von Daniel Rosemann einholen (Blocker).
2. Transitive npm-Lizenzen per Lockfile/SBOM belegen (niedrig, Routine).
3. amulet-core-Version + Lizenz belegen (niedrig, optionales Tool).
4. Danach erst: MIT-`LICENSE` mit korrekter Copyright-Zeile, beide
   `package.json` → `MIT`, `README`-Lizenzabschnitt + Geltungsbeginn/Version,
   ggf. `THIRD-PARTY-NOTICES.md` (Leaflet-/Socket.IO-CDN, Docker-Images).
