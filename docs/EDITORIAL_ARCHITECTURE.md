# Arquitetura Editorial — Copa Pulse

## 1. Resumo Executivo

O Copa Pulse é um produto editorial que transforma a Copa do Mundo em uma narrativa diária. Em 15 segundos, o leitor entende o que aconteceu, por que importa e o que vem depois.

O produto não é um portal de resultados. Não é um agregador de notícias. É uma seleção editorial que prioriza histórias com consequência, surpresa e continuidade narrativa. Cada dia é um capítulo. Cada história escolhida representa um fio narrativo que se conecta aos dias anteriores e seguintes.

A filosofia editorial é: **consequência vale mais que espetáculo, surpresa vale mais que intensidade, e a taxonomia (tipo da história) é soberana sobre o ranking (confiança do sistema).**

---

## 2. Arquitetura Editorial

### Fluxo de Dados

```
API-Football.org
  ↓ (fetch)
Fixture[]
  ↓ (fromFDMatch)
Match[]
  ↓ (enrichMatches)
EnrichedMatch[]
  ↓ (selectStories)
EditorialStory[]
  ↓ (buildBrief + buildNextChapter + buildNarratives)
StoryBrief + NextChapter + ActiveNarrative[]
  ↓ (componentes React)
Homepage
```

### Etapas do Pipeline

1. **Dados**: football-data.org v4 retorna fixtures de um dia específico
2. **Transformação**: `fromFDMatch()` no `transformers.ts` converte API → Match
3. **Enriquecimento**: `enrichMatches()` em `context-builder.ts` adiciona flags narrativas, competitionImpact, teamForm
4. **Classificação**: `classifyStoryType()` em `editorial-story-engine.ts` define o tipo narrativo de cada match
5. **Ranqueamento**: `selectStories()` ordena por tipo hierárquico (1º) e confiança (2º)
6. **Renderização**: Components consomem `EditorialStory[]` via `brief`, `hero`, `stories`

---

## 3. Constituição Editorial

### 3.1 Princípios

1. O produto conta histórias, não resultados
2. Consequência vale mais que espetáculo
3. Surpresa vale mais que intensidade
4. Interesse público é desempate, não fator principal
5. A taxonomia é soberana sobre o ranking
6. O Hero representa a principal história do dia
7. Dias consecutivos devem se conectar como capítulos

### 3.2 Hierarquia dos Story Types

```
upset (1)            — azarão vence favorito
dynasty_fall (2)     — potência eliminada
elimination (3)      — eliminação em mata-mata
favorite_stumbles (4) — favorito não venceu em grupos
milestone (5)        — marco histórico
redemption (6)       — arco de redenção (narrative accum.)
cinderella (7)       — campanha histórica (narrative accum.)
recovery (8)         — reação após derrota
rivalry (9)          — clássico
statement_win (10)   — goleada de favorito
historical (11)      — resultado normal (fallback)
```

### 3.3 Regras do Hero

- O Hero SEMPRE pertence ao storyType hierarquicamente mais alto do dia
- Confidence NUNCA pode inverter a hierarquia entre tipos
- Confidence só ordena stories do MESMO tipo
- HeroMini mostra a 4ª+ história (se stories.length > 3)

---

## 4. Taxonomia — Story Types

### upset
- **Ocorre**: Azarão (não-popular, não-tradicional) vence favorito (popular ou tradicional)
- **Detectado**: `!isWinnerPopular && !isWinnerTraditional && (isLoserPopular || isLoserTraditional)`
- **Raridade**: Extremamente raro (0-3% dos dias)
- **Hierarquia**: #1 — o evento mais forte da Copa

### favorite_stumbles
- **Ocorre**: Time popular ou tradicional não venceu na fase de grupos
- **Detectado**: `(isPopular || isTraditional) && (!winner || isDraw)`
- **Raridade**: Moderado (15-25% dos dias)
- **Hierarquia**: #4 — principal badge da fase de grupos
- **Termina**: Quando o time volta a vencer OU o grupo se decide

### recovery
- **Ocorre**: Time tradicional perdeu a rodada anterior e venceu a atual
- **Detectado**: `teamForm.lost_opener && hasTraditionalWinner`
- **Duração**: 1 rodada — expira após a primeira vitória
- **Hierarquia**: #8

### statement_win
- **Ocorre**: Time popular/tradicional vence de forma dominante
- **Detectado**: diff≥5 OU (diff≥4 && !isWeak) OU (diff==3 && isWinnerPopular && !isWeak)
- **Hierarquia**: #10
- **Observação**: Vitória esperada — a goleada é notável mas não surpreendente

### historical
- **Ocorre**: Resultado normal de fase de grupos — nenhuma narrativa especial
- **Frequência esperada**: 50-60% dos dias
- **Hierarquia**: #11 (fallback final)

---

## 5. Fluxo do Motor Editorial

```
1. fetchDashboardData(targetDay)
   │
   ├── football-data.org → fixtures do dia
   │   └── fromFDMatch() → Match[]
   │
   ├── enrichMatches() → EnrichedMatch[]
   │   ├── detectFlags() → narrativeFlags[]
   │   ├── buildTeamForm() → teamForm
   │   └── buildCompetitionImpact() → competitionImpact
   │
   ├── buildMemory() → TournamentMemory
   │
   ├── selectStories() → EditorialStory[]
   │   ├── classifyStoryType() → storyType
   │   ├── calcConfidence() → 0.0-1.0
   │   ├── sort by: storyType first, confidence second
   │   └── assign priority 1, 2, 3
   │
   ├── buildBrief() → StoryBrief
   ├── buildNextChapter() → NextChapter | null
   └── buildNarratives() → ActiveNarrative[]
```

### Enriquecimento (context-builder.ts)

Cada match recebe:
- **narrativeFlags**: `comeback`, `blowout`, `upset`, `penalty_drama`, `big_team_win`, `high_stakes`, `favorite_draw`
- **competitionImpact**: `qualified`, `eliminated` (apenas mata-mata)
- **teamForm**: `lost_opener`, `current_streak`, `momentum`

### Classificação (editorial-story-engine.ts::classifyStoryType)

A cascade verifica, em ordem:
1. Event facts (traditional_power_eliminated etc.)
2. Narrative arcs (redemption_journey, cinderella_progression, etc.)
3. Historical facts (giant_killing, years_since_last_title, etc.)
4. Elimination / penalty_drama
5. **Cascade de grupos** (se está na fase de grupos):
   - upset
   - recovery
   - favorite_stumbles
   - statement_win
   - historical (fallback)

### Ranqueamento (editorial-story-engine.ts::selectStories)

```ts
stories.sort((a, b) => {
  const rankA = STORY_TYPE_RANK[a.storyType]
  const rankB = STORY_TYPE_RANK[b.storyType]
  if (rankA !== rankB) return rankA - rankB
  return b.confidence - a.confidence
})
```

---

## 6. Regras de Ouro

1. StoryType > Confidence — a hierarquia nunca é invertida
2. favorite_stumbles > statement_win — empate de favorito vence goleada
3. upset > tudo — zebra sempre é a história principal
4. recovery expira em 1 rodada — não acumular recovery por dias
5. historical é o fallback — não forçar badges onde não existem
6. Consequência > Espetáculo — impacto na classificação > goleada
7. Surpresa > Intensidade — zebra 1-0 > goleada de favorito
8. Interesse público é desempate — nunca é fator principal
9. Badge falso destrói credibilidade — melhor sem badge que com badge errado
10. QuickRead não exige diversidade — 3 históricos no mesmo dia é válido
11. HeroMini só aparece se stories.length > 3
12. Dia sem jogos não gera Hero — apenas upcoming/continuidade
13. giant_killing exige winnerRank > loserRank — não disparar para favorito vencendo
14. years_since_last_title nunca dispara em grupos
15. best_result_surpassed nunca dispara em grupos (não é possível superar melhor resultado em grupos)
16. Nenhum badge pode ser atribuído sem detector correspondente
17. Mudança de badge requer mudança no detector, não no confidence
18. Dia 1 da Copa (abertura) pode ter tratamento especial
19. Todo deploy deve ser testado contra os dias de auditoria (Dias 5, 9, 10, 11, 13)
20. Distribuição esperada em grupos: historical ≈ 55%, favorite_stumbles ≈ 20%, statement_win ≈ 15%, recovery < 5%, upset < 5%

---

## 7. Roadmap

### Implementado (D1.0 → D4.3)

- [x] Taxonomia com 11 story types
- [x] Hierarquia de ranking (StoryType > Confidence)
- [x] Cascade de classificação (upset > recovery > favorite_stumbles > statement_win > historical)
- [x] Detector de giant_killing com direção correta
- [x] Detector de years_since_last_title bloqueado em grupos
- [x] best_result_surpassed bloqueado em grupos
- [x] isTraditional() como fallback para favoritos
- [x] WEAK_NATIONS para filtrar statement_win falso
- [x] Boost de confidence para empates de favoritos (+0.12)
- [x] Day Rail com chips DIA 1-N para navegação histórica
- [x] HeroMini = 4ª+ story
- [x] fallback Mock para dados históricos sem API
- [x] MatchesSection com 3 sub-rótulos (ao vivo / encerrados / ainda vai começar)
- [x] NarrativeTracker com fallback (buildGroupSummary)
- [x] StoryColor system com ícones SVG
- [x] QuickRead com hierarquia visual e badges

### Pendente — Próximas Sprints

- [ ] Sprint 3: Correção de recovery via `teamJourney`
- [ ] Sprint 4: Testes constitucionais automatizados
- [ ] Sprint 5: Headlines para empates de favoritos
- [ ] Sprint 6: Verificação de `competitionImpact.qualified` para favoritos já classificados

### Futuro

- [ ] Separar classificação e ranking em módulos
- [ ] Configuração de torneios via JSON (para Euro, Copa América, Champions)
- [ ] Sistema de templates de headline configuráveis

---

## 8. Dívidas Técnicas

1. **Recovery com dados incompletos**: `buildTeamForm` só recebe matches do dia atual. `lost_opener` não pode ser detectado corretamente porque não temos matches do dia anterior. **Solução necessária**: usar `TournamentMemory.teamJourney` como fonte para `lost_opener`.
2. **buildHeadline sem template para favorite_stumbles**: Empates de favoritos geram headline genérica "Team X vs Team Y". **Necessário**: template específico para favorite_stumbles.
3. **favorite_stumbles sem consequência**: Se o favorito já está classificado (grupo decidido), `favorite_stumbles` dispara indevidamente. **Necessário**: verificar `competitionImpact.qualified` (atualmente só populado para mata-mata).
4. **calcConfidence monolítico**: Mistura lógica genérica e específica. Com 11+ tipos, a cadeia else-if fica longa. **Refatoração futura**: boosts separados por tipo.
5. **Mock sem badges reais**: `fallbackDashboard()` retorna dados hardcoded da Argentina de 2022, sem passar pelo motor editorial. Dados mock não testam o sistema real.

---

## 9. Checklist para Pull Requests

Todo PR deve responder a estas perguntas no corpo:

1. **Qual artigo da Constituição este PR implementa?**
   - Cite o artigo específico (ex: "Implementa 4.2 — Hero = storyType mais alto")

2. **Quais testes existentes cobrem esta mudança?**
   - Liste os testes constitucionais aplicáveis

3. **Esta mudança pode alterar a ordem do Hero em algum dia?**
   - [ ] Sim → Liste os dias afetados e justifique
   - [ ] Não

4. **Esta mudança pode alterar o StoryType de alguma partida?**
   - [ ] Sim → Liste quais partidas e por quê
   - [ ] Não

5. **A distribuição esperada dos badges permanece dentro dos targets?**
   - historical ~55%, favorite_stumbles ~20%, statement_win ~15%, recovery <5%, upset <5%

6. **Esta mudança foi testada contra os dias de auditoria (5, 9, 10, 11, 13)?**
   - [ ] Sim → Resultados:
   - [ ] Não → Justificar

7. **Esta mudança quebra o mock?**
   - [ ] Sim → Corrigir antes do merge
   - [ ] Não

8. **Tipo de mudança:**
   - [ ] Bug
   - [ ] Refatoração
   - [ ] Otimização
   - [ ] Nova feature (requer RFC separado)

---

## 10. Conclusão

**SIM — A arquitetura editorial pode ser considerada versão 1.0.**

Justificativa:
- A taxonomia e hierarquia foram validadas contra falseamento em 4 sprints de auditoria
- A implementação cobre todos os tipos narrativos esperados da fase de grupos
- A Constituição resolve conflitos e define regras claras para decisões editoriais
- O código existente suporta a arquitetura com ajustes mínimos (~15 linhas)
- O produto entrega seu valor narrativo: 5 badges distintos com distribuição saudável

A versão 1.0 estável está em produção desde a Sprint D5.0. Próximas sprints devem focar em:
1. Correção do recovery (dependência de dados históricos)
2. Cobertura de testes
3. Tratamento de favoritos já classificados
