# Pla de correcció del Scorecard de Note Status

La branca `fix/105/scorecard-issues` cobreix la [incidència #105](https://github.com/devonthesofa/obsidian-note-status/issues/105). El [Scorecard de la versió 3.1.2](https://community.obsidian.md/plugins/note-status#scorecard) mostra **Review: Caution**, amb **125 avisos** i **4 observacions**. La revisió també indica que l'escaneig de malware no està disponible. L'objectiu és corregir els avisos, acreditar la procedència dels fitxers de release i validar els fluxos del plugin abans de publicar.

## Fase 0. Establir la línia base

- [ ] Registrar els avisos del Scorecard per regla i fitxer. Vincular els avisos de `styles.css` amb els CSS font que els generen i conservar els dos recomptes per comparar amb la pròxima release.
- [ ] Fer una instal·lació neta amb `pnpm install --frozen-lockfile` i executar `pnpm run build`, `pnpm run lint` i `pnpm run format:check`. Registrar qualsevol fallada prèvia per poder comprovar les correccions de cada fase.
- [ ] Executar en mode informatiu les regles amb informació de tipus del linter oficial. Comprovar els requisits de Node, ESLint i TypeScript abans d'integrar-lo amb la configuració actual. [Linter oficial d'Obsidian](https://github.com/obsidianmd/eslint-plugin)
- [ ] Preparar un vault de prova amb notes Markdown, fitxers adjunts, plantilles, estats existents i configuració de sincronització.

**Tancament.** Tenim un inventari d'avisos i uns resultats locals que es poden repetir.

## Fase 1. Compatibilitat d'Obsidian i manifest

**Abast.** 7 avisos d'API i 5 camps desconeguts al manifest.

- [ ] Repassar les crides que assenyala el linter a `main.tsx`, `core/commandsService.ts`, `core/statusStores/frontmatterStatusStore.ts` i les tres vistes. Verificar els requisits de les APIs que es mantinguin.
- [ ] Validar Obsidian `1.7.2` com a mínim proposat. Les definicions oficials indiquen `1.4.4` per a `processFrontMatter` i `1.7.2` per a la signatura actual de `revealLeaf`. Confirmar el mínim amb el linter i una prova real abans de fixar-lo. [Definicions oficials de l'API](https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/obsidian.d.ts)
- [ ] Actualitzar `minAppVersion` a `manifest.json` i afegir a `versions.json` l'entrada de la nova versió amb el mínim validat. Conservar l'historial existent, verificat amb les releases publicades.
- [ ] Treure del manifest els camps `css`, `icon`, `issues`, `license` i `repository`. Validar que Obsidian continua carregant els estils i el plugin. [Esquema del manifest](https://docs.obsidian.md/Reference/Manifest)

**Tancament.** El linter valida el manifest i el plugin funciona en la versió mínima amb les vistes i l'escriptura de frontmatter.

## Fase 2. Promeses i cicle de vida

**Abast.** 20 promeses sense gestionar i 8 callbacks, propietats o mètodes amb un retorn incompatible.

- [ ] Gestionar el resultat de la inicialització i de les operacions `revealLeaf`, `openFile` i `setViewState`. Esperar cada operació quan el flux en depengui i tractar els errors dels fluxos que s'executin en segon pla.
- [ ] Revisar el selector d'estat, el proveïdor de dades agrupades, el dashboard, la barra d'estat, les comandes i la sincronització. Fer servir callbacks síncrons amb gestió explícita de rebuig quan React o Obsidian esperin un retorn `void`.
- [ ] Donar resposta a les operacions fallides de lectura o escriptura del porta-retalls, importació i exportació. Mostrar un missatge d'èxit només quan l'operació hagi acabat.
- [ ] Fer síncron `onunload`. Cancel·lar els temporitzadors pendents en desactivar el plugin i verificar que una assignació ajornada no sobreescrigui un estat afegit per una plantilla.

**Tancament.** Els avisos de promeses es resolen al linter. Les proves cobreixen inici, desactivació, obertura de vistes, sincronització fallida i creació de notes amb plantilla.

## Fase 3. Interfície, finestres i tipus

**Abast.** 32 avisos.

- [ ] Substituir els 8 `alert` per `Notice` en sincronització i plantilles. Fer servir un modal d'Obsidian per a la confirmació d'eliminació i provar tant la confirmació com la cancel·lació.
- [ ] Corregir els 4 temporitzadors i els 2 usos de `document` assenyalats. Fer servir la finestra o el document correctes per a la vista corresponent i substituir l'accés obsolet a `activeLeaf` per l'API pública adequada.
- [ ] Eliminar 7 assercions redundants i substituir els 4 casts a `TFile` per comprovacions `instanceof TFile`. Provar les rutes que apunten a una carpeta o a un fitxer que ja no existeix.
- [ ] Corregir els 2 usos de `hasOwnProperty`, els 2 noms de comandes que repeteixen el nom del plugin i la variable sense ús d'`iconUtils.ts`. Preservar els identificadors de comanda perquè continuïn funcionant les dreceres i les integracions existents.

**Tancament.** El linter valida els canvis i el selector, les comandes i les integracions de l'editor funcionen a la finestra principal i en finestres separades.

## Fase 4. CSS i compatibilitat visual

**Abast.** 42 avisos de `!important`, 6 de subratllat i 1 d'estil estàtic assignat des del codi.

- [ ] Treure els `!important` de `settings.css` i `template-settings.css` ajustant l'abast dels selectors o fent servir variables d'Obsidian. Comprovar els controls de color, els botons de plantilla i els estats d'error, focus i hover.
- [ ] Comprovar el subratllat dels noms a `file-explorer.css` amb el mínim validat a la fase 1. Si l'avís persisteix, substituir les propietats assenyalades per una tècnica compatible que mantingui la personalització del color.
- [ ] Moure l'estil estàtic de la barra d'estat a una classe CSS i regenerar `styles.css` amb la compilació de producció.

**Tancament.** Els avisos de CSS es comproven sobre els fitxers font i l'artefacte compilat. Els controls i l'explorador es veuen correctament amb els temes clar i fosc.

## Fase 5. Dependències, linter i contribucions

**Abast.** 4 recomanacions sobre dependències de desenvolupament i la guia de contribució que falta a **Health**.

- [ ] Substituir `builtin-modules` per `node:module` a la configuració de compilació i verificar que es mantenen correctament les dependències externes del bundle.
- [ ] Comprovar si la configuració activa fa servir `eslint-plugin-import` o `eslint-plugin-react` i eliminar les dependències que no es carreguin.
- [ ] Substituir `lint-staged` preservant la cobertura del pre-commit. Provar un fitxer parcialment preparat per al commit i un nom de fitxer amb espais abans de donar el canvi per bo.
- [ ] Actualitzar `pnpm-lock.yaml` amb els canvis de dependències. Integrar les regles oficials validades a la fase 0 i comprovar-les amb una instal·lació neta.
- [ ] Afegir `CONTRIBUTING.md` amb la instal·lació, les comprovacions i el procés existent per contribuir plantilles.

**Tancament.** Passen la compilació, els linters i el pre-commit amb les dependències actualitzades.

## Fase 6. Attestations i verificació de la release

**Abast.** 2 observacions d'attestations per a `main.js` i `styles.css`.

- [ ] Actualitzar `.github/workflows/release.yml` perquè instal·li amb `pnpm install --frozen-lockfile`, compili i generi les attestations amb `actions/attest`, amb els permisos d'OIDC i d'attestations necessaris. Retirar el lockfile d'npm quan la migració a pnpm estigui verificada.
- [ ] Crear l'esborrany de release amb els mateixos `main.js` i `styles.css` que s'han acreditat i amb el `manifest.json` corresponent.
- [ ] Descarregar els fitxers de la release i verificar tots dos amb `gh attestation verify` contra `devonthesofa/obsidian-note-status`. [Verificació de procedència amb GitHub](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)

**Tancament.** El workflow passa i les attestations verifiquen els fitxers exactes que es distribuiran. Aquesta comprovació requereix una execució a GitHub Actions.

## Fase 7. Regressió i comprovació del Scorecard

Completar les proves funcionals abans de crear el tag de la release. Fer la comprovació pública després de publicar-la.

- [ ] Provar escriptura de frontmatter en llista i valor únic, mapatges de claus, estats d'adjunts, canvis massius i reanomenament i eliminació de fitxers.
- [ ] Provar instal·lació i actualització des de 3.1.2 amb dades existents. Fer les comprovacions en escriptori a la versió mínima i en una versió actual, i provar els fluxos disponibles a mòbil.
- [ ] Verificar que el porta-retalls es fa servir a partir d'accions explícites i que l'enumeració del vault es correspon amb les funcions que la necessiten. Són les altres dues observacions del Scorecard i corresponen a capacitats del plugin. La disponibilitat de l'escaneig de malware depèn d'Obsidian.
- [ ] Després que s'aprovi i es publiqui la release, comparar el Scorecard reescanejat amb l'inventari de la fase 0. Verificar la desaparició dels avisos corregibles i el reconeixement de les dues attestations. Si queda algun avís, registrar-ne la regla, el fitxer i la causa a la incidència #105.

**Tancament.** Les proves del plugin passen i el Scorecard de la nova release reflecteix les correccions i les attestations.
