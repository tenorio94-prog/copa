# Copa Pulse — PROJECT MEMORY

**Última atualização:** Junho 2026  
**Status:** Pronto para validação com usuários reais  
**Próximo passo:** Testar com 10 usuários antes de qualquer nova funcionalidade

---

## 1. Product Vision

### O que é

Copa Pulse é um resumo diário da Copa do Mundo. O usuário abre, lê em 15 segundos, entende o dia. Não é um portal de notícias. É um produto editorial que responde "se você tem 3 minutos, o que precisa saber sobre a Copa hoje?"

### Problema que resolve

Portais esportivos tradicionais (ESPN, Globo Esporte, FIFA) são feitos para consumo prolongado: artigos longos, estatísticas, vídeos, anúncios. O fã casual da Copa — que trabalha, tem família, não acompanha cada jogo — não tem 15 minutos para navegar. Ele quer saber o que importa em segundos.

### Diferenciação

- **Não é portal de placares:** placares existem em 50 lugares. O Copa Pulse entrega **contexto editorial**.
- **Não é site de estatísticas:** não tem xG, posse de bola, chances criadas. Tem narrativa.
- **É resumo premium:** curadoria editorial + IA + design premium + dark mode + mobile-first.

### Por que foi criado

A Copa do Mundo é o maior evento esportivo do planeta, mas a experiência de consumo digital é dominada por portais poluídos e apps de estatísticas. Não existe um produto que responda "o que importa hoje?" de forma rápida, bonita e inteligente. O Copa Pulse foi criado para preencher esse vazio.

---

## 2. Core Product Thesis

> Fãs casuais da Copa preferem um resumo narrativo de 15 segundos a um portal de placares tradicional.

### Detalhamento da tese

- O usuário não quer saber o placar de todos os jogos — quer saber qual é a história mais importante.
- O usuário não quer tabelas completas — quer entender como o grupo está se desenhando.
- O usuário não quer estatísticas — quer contexto ("por que isso importa?").
- O usuário volta não por notificações — mas porque a história não acabou ("Marrocos enfrenta a França amanhã — será que a zebra chega à final?").
- 15 segundos de consumo diário é o suficiente para criar hábito se o valor for consistente.

---

## 3. Product Positioning

### O Copa Pulse NÃO é

- Portal de placares (ESPN, Globo Esporte)
- Site de estatísticas (Sofascore, Transfermarkt)
- Fantasy game (Cartola)
- Site de apostas
- Rede social (Twitter, Instagram)
- Newsletter genérica
- Agregador de notícias (Google News)

### O Copa Pulse É

- Resumo narrativo diário da Copa do Mundo
- Motor editorial que transforma dados em histórias
- Produto de consumo ultra-rápido (15-30 segundos)
- Curadoria editorial automatizada por IA
- Experiência premium, dark mode, mobile-first
- Acompanhamento baseado em histórias, não em partidas isoladas

### Posicionamento para o usuário

"Abra o Copa Pulse todo dia. Em 15 segundos, você entende a Copa."

---

## 4. Current Product Status

**Status:** Tecnicamente funcional. NUNCA testado com usuários reais. Produto nunca foi aberto por uma pessoa de fora do projeto.

**O que NÃO existe ainda:**
- ❌ Nenhum usuário real viu o produto
- ❌ Nenhum deploy público validado
- ❌ Nenhuma operação contínua
- ❌ Nenhum dado de retenção
- ❌ Nenhuma API-Football paga
- ❌ Nenhum cron rodando em produção

### O que já está pronto (código)

- Homepage funcional (ContinuityBar → QuickRead → NextChapter → HeroMini → NarrativeTracker → Matches → Standings)
- Editorial Story Engine (seleciona a história mais importante)
- Historical Facts (5 fatos detectados automaticamente)
- Historical Intelligence (datasets world-cup-history.json + teams.json)
- Narrative Arcs (4 arcos detectados: redemption, cinderella, giant_slayer, multi_upset)
- Tournament Memory (teamJourneys, teamForm, narratives)
- StoryBrief (entidade central de consumo — 3 bullets + continuity)
- NextChapter (mecanismo de retenção — "o que acontece agora?")
- NarrativeTracker (capítulos ativos por time)
- HeroMini (versão compacta do Hero)
- DeepSeek integrado (provedor LLM principal)
- API-Football client (com fallback para dados mockados)
- 81.6kB First Load JS
- Dark mode, mobile-first

### O que ainda falta (para produção)

- API-Football key paga ($99/ano)
- Cron para fetch de dados em VPS
- scripts/build-data.mjs para pipeline de dados
- ISR configurado para revalidar a cada 60s

### O que está em teste

- Nada. Nenhum usuário real viu o produto ainda. Este é o próximo passo.

---

## 5. Current Architecture

### 5.1 API Layer (`lib/api-football.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Cliente HTTP para API-Football v3 |
| **Inputs** | Env vars (API_FOOTBALL_KEY, API_FOOTBALL_LEAGUE_ID) |
| **Outputs** | ApiFixture[], ApiStandingEntry[] |
| **Dependências** | fetch nativo |

### 5.2 Transformers (`lib/transformers.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Converte ApiFixture → Match, calcula importanceScore |
| **Inputs** | ApiFixture |
| **Outputs** | Match |
| **Dependências** | api-football.ts |

### 5.3 Context Builder (`lib/context-builder.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Enriquece Match → EnrichedMatch com flags, impacto, form |
| **Inputs** | Match[] |
| **Outputs** | EnrichedMatch[] |
| **Dependências** | types |

### 5.4 Knowledge Base (`lib/knowledge.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Carrega teams.json + world-cup-history.json. Fornece funções de consulta (getTitles, isAfrican, isTraditional, wasFinalInPreviousEdition, etc.) |
| **Inputs** | Nome do time |
| **Outputs** | TeamInfo, boolean, number |
| **Dependências** | data/teams.json, data/world-cup-history.json |

### 5.5 Historical Context Builder (`lib/historical-context-builder.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Detecta fatos históricos a partir de EnrichedMatch |
| **Inputs** | EnrichedMatch, TournamentMemory |
| **Outputs** | HistoricalFact[] |
| **Dependências** | knowledge.ts |

### 5.6 Tournament Memory (`lib/tournament-memory.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Constrói a memória do torneio: teamJourneys, narratives, teamForm, narrativeArcs |
| **Inputs** | Match[] |
| **Outputs** | TournamentMemory |
| **Dependências** | narrative-accumulation.ts |

### 5.7 Narrative Accumulation (`lib/narrative-accumulation.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Detecta padrões narrativos em múltiplos jogos |
| **Inputs** | Match[] |
| **Outputs** | NarrativeArc[] |
| **Dependências** | types |

### 5.8 Editorial Story Engine (`lib/editorial-story-engine.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Módulo central de seleção. Para cada partida: classifica storyType, calcula confidence (0-1), gera evidence[], headline, narrativeHook, whyItMatters. Ordena por confidence. Define priority 1 (hero), 2 (secondary), 3 (emerging) |
| **Inputs** | EnrichedMatch[], TournamentMemory |
| **Outputs** | EditorialStory[] |
| **Dependências** | Todos os módulos anteriores |

### 5.9 StoryBrief (`lib/story-brief.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Gera o resumo de 15 segundos: headline + 3 bullets + continuity (dia, fase, ontem, hoje). Entidade central de consumo |
| **Inputs** | EditorialStory[], TournamentMemory |
| **Outputs** | StoryBrief |
| **Dependências** | types |

### 5.10 NextChapter (`lib/next-chapter.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Gera o gancho de retenção: headline + hook + openQuestion + próximo evento. Só gera se hasOpenQuestion === true |
| **Inputs** | StoryBrief, NarrativeArc[], TournamentMemory |
| **Outputs** | NextChapter | null |
| **Dependências** | types |

### 5.11 Narrative Tracker (`lib/narrative-tracker.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Transforma NarrativeArc[] em ActiveNarrative[] visível. Calcula capítulo atual, status, próximo passo. Máximo 3 narrativas |
| **Inputs** | NarrativeArc[], TournamentMemory |
| **Outputs** | ActiveNarrative[] |
| **Dependências** | types |

### 5.12 Data Orchestration (`lib/mock-data.ts`)

| Campo | Valor |
|---|---|
| **Responsabilidade** | Ponto central de integração. Tenta API-Football, cai para fallback hardcoded. Constrói todo o estado do dashboard |
| **Inputs** | Env vars |
| **Outputs** | { matches, bulletin, stories, brief, nextChapter, activeNarratives, standings } |
| **Dependências** | Todos os módulos |

---

## 6. Data Flow

```
API-Football (ou fallback mockado)
  ↓
toMatch() → Match[]
  ↓
enrichMatches() → EnrichedMatch[]
  ↓
tournament-memory: buildMemory() → TournamentMemory
  ├── teamJourneys (texto descritivo por time)
  ├── narratives (frases detectadas)
  ├── teamForm (momentum, streaks)
  ├── narrativeArcs (redemption, cinderella, etc.)
  └── historicalFacts (fatos históricos)
  ↓
editorial-story-engine: selectStories() → EditorialStory[]
  ├── storyType (redemption, milestone, upset, etc.)
  ├── confidence (0-1)
  ├── evidence[] (lista de razões)
  └── priority (1=hero, 2=secondary, 3=emerging)
  ↓
story-brief: buildBrief() → StoryBrief
  ├── headline
  ├── bullets[3]
  └── continuity { day, phase, matchCount, yesterday, today }
  ↓
next-chapter: buildNextChapter() → NextChapter | null
  ├── openQuestion
  └── nextEvent
  ↓
narrative-tracker: buildNarratives() → ActiveNarrative[]
  ├── currentChapter
  └── status (active/completed/archived)
  ↓
Homepage (componentes renderizam)
  ├── ContinuityBar
  ├── QuickRead
  ├── NextChapter
  ├── HeroMini
  ├── NarrativeTracker
  ├── Matches
  └── Standings (apenas grupos)
```

---

## 7. Homepage Structure

### Ordem atual (mobile)

1. **ContinuityBar** — "Dia X • Fase Y • Z jogos • Ontem: X • Hoje: Y". Orientação temporal. Cria progressão.
2. **QuickRead** — Headline editorial + 3 bullets. 15 segundos. É o **produto central**.
3. **NextChapter** — "Será que Marrocos chega à final?" Mecanismo de retenção. Só aparece se hasOpenQuestion.
4. **HeroMini** — Tag + headline + why it matters. Versão compacta do Hero. Evita redundância com QuickRead.
5. **NarrativeTracker** — Lista de histórias ativas. "Capítulo 4 de 6". Máximo 3.
6. **Matches** — Jogos ao vivo + próximos. Essencial.
7. **Standings** — Tabela do grupo. **ONLY na fase de grupos** (escondido no mata-mata).

### Desktop sidebar

```
Matches → NarrativeTracker → Standings (groups only) → Footer
```

### Componentes essenciais (não podem ser removidos)

ContinuityBar, QuickRead, NextChapter, Matches.

### Componentes sob validação

NarrativeTracker: "Capítulo 4 de 6" precisa ser testado com usuários. Pode ser confuso.

---

## 8. Historical Intelligence

### 8.1 Datasets

#### `data/teams.json`

39 seleções. Cada entrada:

```json
{
  "continent": "UEFA",
  "titles": 4,
  "finals": 8,
  "semifinals": 13,
  "firstWorldCup": 1934,
  "lastWorldCup": 2022,
  "lastTitle": 2014,
  "bestResult": "Champion",
  "isTraditional": true
}
```

Usado por `knowledge.ts` para consultas de: títulos, finalista anterior, time tradicional, continente.

#### `data/world-cup-history.json`

22 edições (1930-2022). Cada entrada:

```json
{ "year": 2022, "host": "Qatar", "champion": "Argentina", "runnerUp": "France", "third": "Croatia" }
```

Usado para detectar: repeat_final, back_to_back_final, revenge_match, três-peat attempt.

### 8.2 Historical Facts implementados

| Fato | Regra | Peso | Exemplo |
|---|---|---|---|
| `first_african_semifinalist` | Time africano vence mata-mata que leva à semi | 95 | "Marrocos é a primeira seleção africana na semifinal" |
| `giant_killing` | Diferença de ranking ≥ 10 | 85 | "Arábia Saudita (51ª) venceu Argentina (3ª)" |
| `years_since_last_title` | Time na final ou mata-mata não vence há 8+ anos | 90 | "Argentina não vencia desde 1986 — há 40 anos" |
| `defending_champion_eliminated` | Time eliminado com título recente (≤8 anos) | 85 | "França, atual campeã (2018), foi eliminada" |
| `streak_broken` | Perdedor com momentum dominant ou lost_opener + upset | 80 | "Argentina teve sequência invicta quebrada" |
| `first_title_ever` | Time com 0 títulos chega ao mata-mata ou final | 85 | "Croácia pode conquistar seu primeiro título" |
| `title_drought_ended` | Vencedor na final + yearsSinceLastTitle > 8 | 90 | "Argentina encerra jejum de 36 anos" |
| `repeat_final` | Final com mesmo par da edição anterior | 85 | "Repetição da final anterior" |
| `back_to_back_final` | Time em 2 finais consecutivas | 80 | "França está em sua segunda final consecutiva" |
| `best_result_surpassed` | Time supera seu melhor resultado histórico | 90 | "Marrocos superou melhor resultado" |

### 8.3 Confidence bonuses no Editorial Story Engine

| Fato | Bônus |
|---|---|
| `first_title_ever` | +0.15 |
| `title_drought_ended` | +0.10 |
| `repeat_final` | +0.10 |
| `back_to_back_final` | +0.08 |
| `best_result_surpassed` | +0.12 |

---

## 9. Narrative System

### 9.1 Narrative Arcs

| Arco | Condição | Peso | Exemplo |
|---|---|---|---|
| `redemption_journey` | Time perde na estreia E chega à final E vence | 95 | Argentina 2022 |
| `cinderella_progression` | Time vence 2+ populares em mata-mata (inclui pênaltis) | 90 | Marrocos 2022 |
| `giant_slayer` | Time elimina 2+ populares em mata-mata | 85 | Marrocos 2022 |
| `multi_upset_run` | Time vence 2+ favoritos na fase de grupos | 85 | Japão 2022 |

### 9.2 NextChapter

Gerado a partir do NarrativeArc ativo de maior weight. Cada tipo de arco tem:
- headline específica
- hook narrativo
- pergunta aberta (openQuestion)

Só é gerado se `hasOpenQuestion === true`. Se a narrativa foi concluída (ex: Argentina campeã), não gera NextChapter.

### 9.3 NarrativeTracker

Mostra ao usuário as histórias ativas da Copa:
- Título da narrativa ("Marrocos: Campanha histórica")
- Capítulo atual ("Capítulo 4 de 6")
- Status (active / completed / archived)
- Próximo passo

**Em validação:** o conceito de "Capítulo 4 de 6" pode não ser intuitivo para todos os usuários. Precisa de teste.

---

## 10. Editorial Story Engine

### 10.1 EditorialStory

```typescript
interface EditorialStory {
  id: string
  headline: string        // 8-15 palavras, editorial
  storyType: "redemption" | "historical" | "upset" | "elimination" | "dynasty_fall" | "cinderella" | "milestone" | "rivalry"
  confidence: number      // 0-1
  evidence: string[]      // razões legíveis
  narrativeHook: string   // frase de abertura
  whyItMatters: string    // consequência
  priority: number        // 1=hero, 2=secondary, 3=emerging
  matchId: string
  tag: string             // "🔥 Redenção", "🌍 Marco histórico"
}
```

### 10.2 Seleção de histórias

1. **classifyStoryType** — por ordem: editorial event → narrative arc → historical fact → match flag
2. **calcConfidence** — base 0.1 + eventos editoriais (+0.8-0.9) + arcos (+0.6-0.9) + fatos (+peso/500) + estágio (+0.2-0.5) + popular eliminado (+0.3) + pênaltis (+0.15) + zebra (+0.15). Cap 1.0
3. **buildEvidence** — lista legível de razões
4. **Ordena** por confidence decrescente
5. **Atribui priority**: 1 (hero), 2 (secondary), 3 (emerging)

**Hero:** maior confidence. Se há final, é sempre hero. Se há editorialEvent weight ≥ 90, garante top 3.

---

## 11. Major Architectural Decisions

### Decisão 1: ATTENTION_SCORE rejeitado

**Problema:** Croácia-Brasil (subvalorizado) parecia um problema de falta de atenção/popularidade.

**Solução proposta:** ATTENTION_SCORE (medir "quanto as pessoas clicariam").

**Decisão final:** Rejeitado. O problema não era falta de atenção — era falta de uma categoria editorial explícita (`traditional_power_eliminated`). ATTENTION_SCORE nos aproximaria de um portal de cliques. Editorial Events nos mantêm alinhados com a visão de produto editorial.

### Decisão 2: Editorial Events adotados

Categorias explícitas sobrepõem scores contínuos. `traditional_power_eliminated` é mais auditável que um score de atenção.

### Decisão 3: StoryBrief como entidade central

Originalmente StoryBrief era uma "view". Durante o desenvolvimento descobriu-se que o USUÁRIO consome StoryBrief (não EditorialStory). A arquitetura foi reorganizada para que StoryBrief seja a entidade principal e StoryPackage seja derivado.

### Decisão 4: QuickRead como centro do produto

O Editorial Story Engine era o centro original. Na prática, QuickRead se tornou o produto — 15 segundos de consumo. O motor editorial é o que acontece nos bastidores.

### Decisão 5: NextChapter como mecanismo de retenção

NextChapter responde "por que voltar amanhã?" através de perguntas abertas, não notificações. O hábito vem de história inacabada, não de push.

### Decisão 6: Hero reduzido para HeroMini

Product Audit mostrou 70% de redundância com QuickRead. HeroMini manteve tag + headline + why it matters. Confidence e storyType técnico foram removidos do componente.

### Decisão 7: Standings condicional

Standings só aparece na fase de grupos. No mata-mata, a tabela de grupos não é mais relevante.

### Decisão 8: DeepSeek como LLM padrão

DeepSeek (deepseek-chat) substituiu OpenAI como provedor padrão por custo inferior. OpenAI mantido como fallback/configurável via LLM_PROVIDER env var.

---

## 12. Things Explicitly Rejected

| Ideia | Motivo da rejeição |
|---|---|
| **ATTENTION_SCORE** | Score contínuo menos auditável que categoria editorial. Viés de popularidade indesejado. |
| **Gamificação** | Streaks, badges, rankings — zero relação com o valor do produto. |
| **Narrative Heat Score** | Complexidade desnecessária. Confidence já faz o trabalho. |
| **Estatísticas avançadas (xG)** | Não agregam valor narrativo. O produto é editorial, não estatístico. |
| **Comentários de usuários** | Exige moderação. Desvia do foco editorial. |
| **Login / Personalização** | Barreira de entrada. Produto deve funcionar sem cadastro. |
| **Modo claro** | Baixo valor adicional. Dark mode é suficiente. |
| **Recomendação personalizada** | Complexidade alta para produto sem audiência. |
| **Análise de sentimento / NLP** | Exige redação, não algoritmo. |
| **App nativo (iOS/Android)** | PWA resolve. |
| **Newsletter (pré-validação)** | Exige email service e audiência. Adiar. |
| **Push notifications** | Exige permissão do usuário. Adiar. |
| **Áudio (pré-validação)** | Custo de TTS sem saber se alguém ouve. Adiar. |
| **Player Facts (pré-validação)** | Especificado mas não implementado. Adiar até validação. |
| **Complexidade prematura** | Qualquer feature que não responda "o usuário volta amanhã?" |

---

## 13. Product Audits

### Product Audit (Sprint 5.0)

**Conclusão principal:** Homepage tinha 7 componentes, mas 3 deles faziam o trabalho pesado (ContinuityBar, QuickRead, Matches). Hero redundante com QuickRead (70% sobreposição). NextChapter enterrado na posição 3.

**Resultado:** Hero → HeroMini, NextChapter subiu para posição 3 (após QuickRead), Standings condicional.

### Homepage Simplification (Sprint 5.1)

**Mudanças:** 7 componentes → 4-5 essenciais. QuickRead expandido absorveu tag do Hero. NextChapter + NarrativeTracker fundidos parcialmente. Standings escondido no mata-mata.

### Founder Review (Sprint U1)

**Conclusão:** O produto nunca esteve "pronto". A cada sprint sem teste, acumulam-se suposições não validadas. A decisão é PARAR DE CONSTRUIR E TESTAR.

---

## 14. Validation Plan

### Objetivo

Validar se existe demanda pelo formato "resumo narrativo diário de 15 segundos".

### Amostra

10 usuários. 3 perfis:
- 5 casuais (acompanham só a Copa)
- 3 fanáticos (acompanham futebol sempre)
- 2 não-fãs (não acompanham)

### Métricas (target)

| Métrica | Target |
|---|---|
| Entendeu a história principal em 15s | ≥ 8/10 |
| Entendeu o que acontece amanhã em 30s | ≥ 7/10 |
| Disse que voltaria amanhã | ≥ 6/10 |
| Entendeu "Capítulo X de Y" | ≥ 6/10 |
| Usaria durante a Copa | ≥ 7/10 |

**Aprovado se 4/5 baterem target.**

### Critérios de decisão

| Resultado | Condição | Ação |
|---|---|---|
| ✅ Continuar | 4/5 métricas aprovadas | Montar operação + 100 usuários |
| 🟡 Ajustar | 3/5 + problema claro | Corrigir em 1 semana, re-testar |
| 🔄 Pivotar | Produto compreendido mas sem necessidade | Mudar formato ou público |
| 🔴 Encerrar | < 5/10 entenderam propósito | Arquivar, aprender |

### Documentos de teste

- `spec-u1-execution.html` — plano completo de recrutamento, sessão, perguntas, planilha
- Roteiro de 15 minutos, perguntas abertas vs fechadas vs proibidas

---

## 15. Infrastructure

### Arquitetura operacional planejada (para produção)

```
Cron */5 * * * *
  ↓
fetch-data.sh → API-Football → /tmp/*.json
  ↓
scripts/build-data.mjs
  ↓
  ├── toMatch() → enrichMatches() → buildMemory()
  ├── selectStories() → buildBrief()
  └── latest.json (salvo em public/data/)
  ↓
Next.js ISR → Homepage
```

### Stack

| Componente | Tecnologia | Custo |
|---|---|---|
| Frontend | Next.js 13 (App Router) | Grátis (Vercel Hobby) ou $20/mês (Pro) |
| Estilos | Tailwind CSS v3 | Grátis |
| LLM | DeepSeek (deepseek-chat) | ~$1-2/mês para uso diário |
| Dados | API-Footwall v3 | $99/ano (contratar APÓS validação) |
| Deploy | Vercel | Grátis (até 100GB bandwidth) |
| Dataset | JSON em disco (data/) | Grátis |

> **⚠️ Estratégia de API durante validação:**  
> `football-data.org` oferece API gratuita com dados de futebol (incluindo partidas e classificações) sem custo. Durante a validação U1, dados mockados são suficientes. Se for necessário testar com dados reais ANTES de contratar API-Football, usar football-data.org como ponte.  
> **API-Football ($99/ano) só deve ser contratada APÓS evidência de que usuários reais usam o produto.**

### Dependências da VPS (alternativa ao Vercel)

- Node.js 18+
- curl
- cron
- Nginx
- ~2GB RAM, 10GB disco
- Custo: ~$10-15/mês

---

## 16. Future Work (ONLY AFTER VALIDATION)

**Regra: NADA abaixo deve ser iniciado antes da validação com 10 usuários.**

### Prioridade 1 (após validação positiva)

- API-Football key + cron + dados reais
- Deploy contínuo na Vercel
- Escalar para 100 usuários
- Medir retenção real (DAU/WAU)

### Prioridade 2 (após validar retenção)

- `data/rivalries.json` (20 rivalidades) — habilita `classic_rivalry`, `revenge_match`
- `data/historical-events.json` (15 eventos históricos) — habilita `historic_event_referenced`
- Novos Historical Facts: `repeat_final_arc`, `revenge_arc`, `dynasty_attempt`, `host_nation_dream`

### Prioridade 3 (após validar crescimento)

- Player Facts (last_dance, legacy_complete, injury) — dataset de 5-10 jogadores lendários
- Áudio diário (OpenAI TTS, ~$1.20/mês)
- Social cards / OG images (@vercel/og)
- Newsletter (setup de email)
- Push (service worker)

---

## 17. Current Biggest Risks

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Usuários não entendem o conceito | Média | Crítico | Teste com 10 usuários antes de qualquer feature |
| Usuários não retornam | Média | Crítico | NextChapter + ContinuityBar + QuickRead em 15s |
| "Capítulo 4 de 6" é confuso | Alta | Médio | Testar no U1. Se falhar, substituir por texto mais simples |
| Resumo diário não cria hábito | Média | Crítico | A própria hipótese central do produto |
| API-Footwall fica instável na Copa | Média | Alto | Cache + fallback manual |
| DeepSeek falha ou fica lento | Baixa | Médio | Fallback para templates.ts (sem LLM) |
| Timing da Copa | Alta | Crítico | Produto precisa estar operacional ANTES do primeiro jogo |

---

## 18. Current Open Questions

Perguntas que NENHUM modelo de linguagem pode responder. Só usuários reais.

| Pergunta | Por que é importante | Será respondida por |
|---|---|---|
| Usuários entendem "Capítulo X de Y"? | Se o NarrativeTracker for confuso, deve ser substituído por texto mais simples | Pergunta 4 do roteiro U1 |
| NextChapter realmente aumenta retenção? | Se ninguém perceber ou se importar com "o que acontece amanhã", o mecanismo central de retenção falhou | Pergunta 5 do roteiro U1 ("voltaria amanhã?") |
| QuickRead sozinho já entrega valor? | Se o usuário entende o dia só com o QuickRead e ignora o resto, outros componentes podem ser desnecessários | Fase 1 do roteiro (primeiros 15s) |
| Casuais entendem o produto mais rápido que fanáticos? | Se o perfil casual não entender em 15s, o produto não atinge o público-alvo | Comparação entre perfis na planilha |
| Usuários voltam amanhã sem incentivo externo? | Retenção espontânea é a métrica mais importante do produto | Pergunta 5 ("voltaria amanhã?" — sem prompt, sem incentivo) |
| Usuários compartilham com amigos? | Se ninguém compartilhar, não há crescimento orgânico | Observação durante o teste (compartilharam o link?) |
| HeroMini adiciona valor ou é redundante? | Se ninguém notar o HeroMini, ele pode ser removido | Fase 3 do roteiro ("o que você ignorou?") |

**Todas essas perguntas serão respondidas após 10 entrevistas de 15 minutos cada. Nenhuma requer código novo.**

---

## 19. Founder Learnings

- **Construir é mais confortável que validar.** A cada sprint sem teste, acumulam-se suposições não validadas. O custo de pivotar cresce com o tempo investido.
- **O próximo aprendizado vem de usuários, não de código.** Após 15 sprints, o motor editorial está maduro. A próxima descoberta não será uma nova flag ou um novo dataset — será o comportamento de pessoas reais.
- **O produto é editorial, não estatístico.** O valor não está em ter mais dados — está em escolher quais dados importam e contar a história certa.
- **Histórias geram mais valor que dados brutos.** "Argentina quebra jejum de 36 anos" vale mais que um placar. O Why It Matters é o produto.
- **QuickRead é o produto.** Editorial Story Engine, Historical Facts, Narrative Arcs — tudo isso é motor invisível. O usuário vê 3 bullets e 15 segundos. Se isso não funcionar, nada do resto importa.
- **NextChapter é o mecanismo de retenção.** Notificações não criam hábito. Histórias inacabadas criam. O produto deve terminar cada dia com uma pergunta, não uma resposta.
- **Remover é mais difícil que adicionar.** AProduct Audit mostrou que Hero era 70% redundante com QuickRead. Foram necessárias 15 sprints para perceber que o componente mais importante (QuickRead) deveria ser o centro — e não o Hero.

---

## 20. IMPORTANT RULES

Estas regras são PERMANENTES. Não devem ser quebradas sem discussão explícita.

1. **Não adicionar funcionalidades antes da validação com 10 usuários.** Nenhuma. Player Facts, Áudio, Newsletter, Rivalries — tudo espera.
2. **Não criar novos componentes sem evidência de usuários.** Se um usuário não pediu explicitamente, não construa.
3. **Priorizar simplicidade sobre potência.** Se houver dúvida entre uma solução simples e uma poderosa, escolher a simples.
4. **QuickRead é o principal componente do produto.** Nada deve canibalizar ou enterrar o QuickRead. A homepage deve ser organizada em torno dele.
5. **NextChapter é o principal mecanismo de retenção.** A pergunta aberta (openQuestion) é mais importante que qualquer notificação externa.
6. **O produto é editorial, não estatístico.** xG, posse de bola, chances criadas, escalações detalhadas — não pertencem ao Copa Pulse.
7. **O objetivo é acompanhar a Copa através de histórias.** Cada decisão deve ser filtrada por "isso ajuda o usuário a entender a Copa em 3 minutos?"
8. **Se houver dúvida entre construir ou testar, testar.** Um protótipo com 10 usuários vale mais que 3 sprints de features.
9. **Remover é melhor que adicionar.** Se um componente não entrega valor único, deve ser removido ou fundido.
10. **Este documento deve ser lido por qualquer novo agente antes de propor mudanças.** Qualquer proposta que contradiga estas regras precisa de justificativa explícita.
11. **Não iniciar novas sprints arquiteturais antes da conclusão da validação U1.** O motor editorial está completo. O que falta não é código — é saber se alguém quer o produto. Qualquer proposta de nova feature, novo dataset ou novo componente antes do fim dos testes com 10 usuários deve ser automaticamente rejeitada, a menos que responda diretamente a um problema identificado nos testes.

---

## 21. Arquivos de referência

| Arquivo | Conteúdo |
|---|---|
| `spec-context-dump.html` | Estado completo do sistema (25+ módulos, 4 camadas) |
| `spec-product-audit.html` | Product Audit completo (redundâncias, simplificações) |
| `spec-u1-execution.html` | Plano de teste com 10 usuários (roteiro, perguntas, planilha, critérios) |
| `spec-founder-review.html` | Founder Review (riscos, decisões, veredito) |
| `AGENTS.md` | Guia rápido para agentes OpenCode (comandos, estrutura, trivia) |
| `data/teams.json` | Perfil de 39 seleções |
| `data/world-cup-history.json` | 22 edições da Copa (1930-2022) |
| `pulse/.env.local` | Chaves de API (DeepSeek, API-Football, OpenAI) |

---

## 22. INIT RECOVERY

Procedimento para um novo agente retomar o projeto imediatamente após `/init`.

### Checklist obrigatório

1. **Ler PROJECT_MEMORY.md completo** (este documento) — contexto completo do produto, arquitetura e decisões.
2. **Ler Current Product Status** (seção 4) — entender que o produto NUNCA foi testado com usuários reais.
3. **Ler Current Open Questions** (seção 18) — entender quais perguntas ainda não foram respondidas.
4. **Ler IMPORTANT RULES** (seção 20) — regras permanentes que não devem ser quebradas.
5. **Verificar se a validação U1 já foi executada.** Se sim, ler os resultados e agir conforme os critérios de decisão. Se não, a prioridade absoluta é executar a validação U1 (ver spec-u1-execution.html).
6. **Não propor novas funcionalidades** até que a validação U1 seja concluída.
7. **Não propor novos datasets, módulos ou componentes** até que haja evidência de que usuários reais querem o produto.

### Pergunta única antes de qualquer ação

> "Isso ajuda a responder uma das perguntas abertas da seção 18?"

Se a resposta for NÃO, a ação deve ser adiada.

---

## 23. Memory Changelog

| Versão | Data | Mudanças |
|---|---|---|
| v1.0 | Jun 2026 | Documento inicial criado. 19 seções cobrindo visão, arquitetura, decisões, validação. |
| v1.1 | Jun 2026 | Adicionadas Current Open Questions (seção 18), INIT RECOVERY, Changelog, Regra #11, ajuste de status, nota sobre football-data.org. |
