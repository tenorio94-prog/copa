# Copa Pulse — Especificação Visual da Homepage

**Versão:** 1.0  
**Autor:** Head of Product / UX Lead  
**Baseado em:** Wireframe validado, Product Plan vFinal  
**Público:** Desenvolvedor full-stack (entrega direta)

---

## Filosofia de Design

> O Copa Pulse não é um painel esportivo. É um editor automatizado que responde "o que importa hoje?" em 30 segundos.

Cada decisão visual serve a esse princípio. A hierarquia não é determinada por "o que temos" (dados), mas por "o que importa" (editorial). A página deve parecer uma newsletter premium que o usuário abre todo dia — não um placar que ele consulta uma vez.

**Referências de tom:**
- The Athletic (editorial, limpo, hierarquia tipográfica forte)
- Linear (espaçamento, cards sutis, dark mode, microinterações)
- Apple News (hierarquia de conteúdo, tratamento editorial)
- Spotify Wrapped (cards com personalidade, dados como narrativa)

**Regra de ouro:** Se algo não ajuda o usuário a entender a Copa em 3 minutos, não está na página.

---

## 1. Layout Geral

### Breakpoints

| Nome | Largura | Alvo | Comportamento |
|---|---|---|---|
| Mobile | < 480px | Smartphones | Single column, padding 16px |
| Tablet | 481-900px | Tablets | Single column, padding 24px, max width 480px |
| Desktop | 901-1440px | Laptops/Desktops | Two-column, max container 1100px |
| Wide | > 1440px | Telas grandes | Two-column com aligned content, max container 1200px |

### Estrutura da Página (Mobile)

```
┌────────────────────────────────┐
│ Status Bar (native)            │  h: 44px (iOS) / 24px (Android)
├────────────────────────────────┤
│ Nav Bar                        │  h: 56px • fixed top
│ [Logo "CP"]              [≡]   │  z-index: 100, backdrop-filter: blur
├────────────────────────────────┤
│                                │
│ ┌────────────────────────────┐ │  padding: 16px
│ │  HERO SECTION              │ │
│ │  (1 card destacado)        │ │  h: auto • min-h: 160px
│ └────────────────────────────┘ │  margin-bottom: 20px
│                                │
│ ┌────────────────────────────┐ │
│ │  WHAT HAPPENED TODAY       │ │  margin-bottom: 24px
│ │  (3 cards verticais)       │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │  LIVE / UPCOMING MATCHES   │ │  margin-bottom: 24px
│ │  (2 cards horizontais)     │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │  QUICK STANDINGS (compact) │ │  margin-bottom: 24px
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │  FOOTER / SHARE            │ │  h: 64px
│ └────────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

### Estrutura da Página (Desktop 2-col)

```
┌──────────────────────────────────────────────────┐
│ Nav Bar (full width)                              │  h: 56px
├──────────────────────┬───────────────────────────┤
│                      │                            │
│  ┌────────────────┐  │  ┌─────────────────────┐  │
│  │  HERO          │  │  │  LIVE MATCHES       │  │
│  │  (full width)  │  │  │  (mini cards)       │  │
│  └────────────────┘  │  └─────────────────────┘  │
│                      │                            │
│  ┌────────────────┐  │  ┌─────────────────────┐  │
│  │  WHAT HAPPENED │  │  │  QUICK STANDINGS    │  │
│  │  TODAY (cards) │  │  │  (compact table)    │  │
│  └────────────────┘  │  └─────────────────────┘  │
│                      │                            │
│ ─── col 1 (1.5fr) ──│──── col 2 (1fr) ────────── │
│                      │                            │
└──────────────────────┴───────────────────────────┘
│ Footer (full width)                                │
└────────────────────────────────────────────────────┘
```

### Grid System (Desktop)

- Grid: 12-col no container (max 1200px)
- Col 1 (conteúdo): 7 colunas (1.5fr)
- Col 2 (dados auxiliares): 5 colunas (1fr)
- Gutter: 32px entre colunas

---

## 2. Hierarquia Visual

A página tem 4 níveis visuais. O olho do usuário segue nesta ordem:

### Nível 1 — Hero (o que importa HOJE)
- Maior destaque visual
- Background sutil com gradiente
- Ocupa o topo da viewport
- Headline em weight 700, tamanho 22-32px
- Título do jogo + placar + "por que importa"

### Nível 2 — O que aconteceu (narrativa)
- Título de seção: label uppercase + tracking 2px
- 3 cards com resultado + "why it matters"
- Cada card: resultado em weight 600 • contexto em weight 400 cor secundária • why matters em itálico

### Nível 3 — Jogos (ação imediata)
- Ao vivo: badge verde pulsante
- Score grande, times em weight 600
- Estilo: quadro de placar, não card de conteúdo
- Layout horizontal, lado a lado

### Nível 4 — Tabela (referência)
- Compacta, sem destaques
- Fonte menor 10-11px
- Apenas posição, time, pontos, saldo
- Rolagem horizontal se necessário

### Peso visual no mobile (proporção)

| Elemento | % da viewport | Prioridade |
|---|---|---|
| Hero | 25-30% | Crítica |
| What Happened | 35-40% | Alta |
| Matches | 15-20% | Média |
| Standings | 10-15% | Baixa |
| Footer | 5% | Mínima |

---

## 3. Sistema de Design — Tipografia

### Type Scale

```css
/* Mobile */
--fs-display: 28px (clamp: 24-32px)  /* Hero headline */
--fs-headline: 20px (clamp: 18-24px) /* Card titles, match scores */
--fs-body: 14px (clamp: 13-15px)     /* Card content */
--fs-caption: 12px (clamp: 11-13px)  /* Meta, timestamps, labels */
--fs-micro: 10px (clamp: 9-11px)     /* Badges, importance_score tags */

/* Desktop scale up by ~15% */
--fs-display-desktop: 36px
--fs-headline-desktop: 24px
--fs-body-desktop: 15px
--fs-caption-desktop: 13px
--fs-micro-desktop: 11px
```

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Weight Usage

| Weight | Uso |
|---|---|
| 400 (Regular) | Body text, card descriptions, meta |
| 500 (Medium) | Section labels, match team names |
| 600 (Semibold) | Card titles, match scores, table team names |
| 700 (Bold) | Hero headline, "Why It Matters" label |
| 800 (Extrabold) | Logo, importance_score value |

### Line Height

- Hero headline: 1.1
- Card titles: 1.3
- Body: 1.6
- Captions: 1.4

### Letter Spacing

- Section labels (uppercase): 0.08em
- Everything else: normal (-0.01em para headlines)

### Color System

```
--text-primary:   #f4f4f5 (zinc-100)
--text-secondary: #a1a1aa (zinc-400)
--text-tertiary:  #71717a (zinc-500)

--accent:     #6366f1 (indigo-500)
--accent-2:   #818cf8 (indigo-400)

--green:   #22c55e (green-500)  — ao vivo, vitória
--amber:   #f59e0b (amber-500) — destaque médio
--red:     #ef4444 (red-400)   — derrota, alerta
--rose:    #f43f5e (rose-500)  — importância máxima

--bg:        #0a0a0b (near-black)
--surface:   #121214
--surface-2: #1a1a1e
--border:    #222226
--border-hover: rgba(99,102,241,.3)
```

### Link/Interactive Colors

```css
--link: var(--accent)
--link-hover: var(--accent-2)
--tap-highlight: rgba(99,102,241,.15)
```

---

## 4. Componentes

### 4.1 NavBar

```
┌────────────────────────────────────┐
│ [Logo]                      [≡ Menu] │  bg: rgba(10,10,11,.8)
│  Copa Pulse                         │  backdrop-filter: blur(20px)
│                           ⚙️ Sobre │  border-bottom: 1px solid border
└────────────────────────────────────┘
  h: 56px • fixed top • z-index: 100
```

**Logo:**
- "CP" em badge arredondado (bg: accent, cor: white, font-size: 11px, border-radius: 6px)
- "Copa Pulse" ao lado (font-weight: 600, font-size: 14px)

**Desktop:**
- Nav com links visíveis: "Sobre", "Compartilhar"
- Mobile: hamburger (≡) com drawer

### 4.2 Hero Section

```
┌──────────────────────────────────────────┐
│                                          │
│  🔥 Brasil vence e elimina a Espanha     │  fs: 22px (mobile) / 28px (desktop)
│                                          │  font-weight: 700, line-height: 1.1
│  Richarlison decide na prorrogação.      │  fs: 14px • color: text-secondary
│  Brasil enfrenta França nas quartas.     │  margin-top: 4px
│                                          │
│  ┌──────────────────────┬─────────────┐ │
│  │ importance_score: 95 │ 🏆 Mata-mata │ │  badges inline
│  └──────────────────────┴─────────────┘ │  font-size: 10px
│                                          │
└──────────────────────────────────────────┘
```

**Background:** linear-gradient(135deg, rgba(99,102,241,.12), rgba(168,85,247,.08)), border 1px solid rgba(99,102,241,.15)
**Border Radius:** 16px
**Padding:** 20px (mobile) / 28px (desktop)

**Empty State:** "Aguardando primeiro jogo da Copa." com contagem regressiva no lugar do headline.

### 4.3 What Happened Today (Card)

```
┌──────────────────────────────────────────┐
│                                          │
│  📰 O QUE ACONTECEU HOJE                 │  section label
│                                          │  font-size: 10px, uppercase, letter-spacing: 1.2px
│                                          │  color: text-tertiary, margin-bottom: 12px
│  ┌────────────────────────────────────┐ │
│  │ 🇧🇷 Brasil 3×1 🇪🇸 Espanha        │ │  fs: 15px, weight: 600
│  │ Mata-mata • Quartas de final      │ │  fs: 12px, color: text-tertiary
│  │                                    │ │
│  │ Por que importa: Brasil evita      │ │  fs: 12px, italic, color: accent-2
│  │ a França nas oitavas e ganha       │ │  border-left: 2px solid accent
│  │ dois dias de descanso.             │ │  padding-left: 8px, bg: sutil
│  └────────────────────────────────────┘ │  margin-top: 8px
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ... (2nd card)                     │ │  spacing entre cards: 8px
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ... (3rd card)                     │ │
│  └────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

**Card Container:**
- bg: surface-2, border: 1px solid border, radius: 10px
- padding: 12px 14px
- hover: border-color hover

**Importance Score Badge (opcional):**
- Inline no canto superior direito do card
- bg: rgba(99,102,241,.1), color: accent-2, fs: 9px
- Só aparece se score > 40

**Empty State:**
"🕐 Nenhum jogo ontem. Acompanhe os jogos de hoje abaixo."
Ícone + texto centralizado, opacity .6

### 4.4 Matches (Live / Upcoming)

```
┌──────────────────────────────────────────┐
│                                          │
│  ⚽ JOGOS                                │  section label
│                                          │
│  ┌──────────────┐  ┌──────────────┐     │  mobile: side-by-side
│  │ 🇫🇷 1 - 0 🇵🇹│  │ 🇳🇱 -  🇺🇾   │     │  gap: 8px
│  │    67' AO VIVO│  │   16:00     │     │
│  │    ●●●●●○     │  │             │     │
│  └──────────────┘  └──────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

**Card design:**
- bg: surface, border: 1px border, radius: 12px
- padding: 14px 16px
- Texto centralizado
- Team: flag + 3-letter code, weight 600, fs: 18px (placar) / 14px (times)

**Live indicator:**
- Badge "AO VIVO" com bullet pulsante vermelho
- bg: rgba(239,68,68,.1), color: red, fs: 10px
- @keyframes pulse (opacity 1 → 0.4 → 1, 1.5s)

**Empty State:**
"⚽ Nenhum jogo hoje. Próximo jogo: [data]."
Ícone + texto, opacity .6

### 4.5 Quick Standings

```
┌──────────────────────────────────────────┐
│                                          │
│  📊 TABELA • GRUPO D                     │  section label + group selector
│                                          │
│  ┌─┬────────────┬───┬────┐              │
│  │1 │🇦🇷 Argentina│ 4 │ +2 │              │  row hover: bg sutil
│  │2 │🇲🇽 México   │ 2 │  0 │              │  fs: 11px
│  │3 │🇵🇱 Polônia   │ 1 │ -1 │              │  padding: 6px 10px
│  │4 │🇸🇦 Arábia   │ 1 │ -1 │              │  bg: surface-2, radius: 6px
│  └─┴────────────┴───┴────┘              │  gap entre rows: 3px
│                                          │
│  [Grupo A ▾] [Grupo B ▾] [Grupo C ▾]    │  pills for group switching
│                                          │
└──────────────────────────────────────────┘
```

**Desktop:** 2 tabelas visíveis lado a lado (grupos mais relevantes)
**Mobile:** dropdown ou swipe horizontal para trocar grupo
**Empty State:** "📊 Classificação disponível após o primeiro jogo."

### 4.6 Share Footer

```
┌──────────────────────────────────────────┐
│                                          │
│  Compartilhe: [X] [WhatsApp] [📋 Link]   │  fs: 12px
│                                          │  icons com hover state
│  Copa Pulse • Gerado em 15/06 06:03      │  fs: 10px, text-tertiary
│                                          │
└──────────────────────────────────────────┘
```

---

## 5. Spacing System

### Base Unit: 4px

```css
/* Spacing scale */
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### Section Spacing (Mobile)

| Between | Value |
|---|---|
| Content padding (sides) | 16px |
| Between sections | 24px |
| Between cards within a section | 8px |
| Card padding | 12-14px (inner) |
| Section label → first card | 12px |
| Hero → next section | 20px |
| Last section → footer | 32px |

### Desktop Adjustments

| Element | Change |
|---|---|
| Content padding (sides) | 32px (col gap) |
| Between sections | 32px |
| Card padding | 20px (inner) |
| Max container width | 1200px |

---

## 6. States

### 6.1 Empty State (Primeira Visita — Pré-Copa)

```
┌──────────────────────────────────────────┐
│                                          │
│  COPA DO MUNDO 2026                      │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  🏆 A Copa começa em               │ │
│  │  47 dias • 14 horas • 23 min       │ │  fs: 18px, weight: 700
│  │                                    │ │
│  │  [Ativar lembrete]                 │ │  button: accent bg
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  📰 O que aconteceu hoje           │ │
│  │  Nada ainda. A Copa começa em      │ │
│  │  47 dias.                          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ⚽ Primeiro jogo:                  │ │
│  │  🇧🇷 Brasil vs 🇷🇸 Sérvia           │ │
│  │  📅 15/06 • 16:00                  │ │
│  └────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

**Comportamento:**  
- Hero mostra contagem regressiva  
- "What Happened Today" mostra mensagem genérica  
- Matches mostra o primeiro jogo do evento  
- Standings: "Disponível após o primeiro jogo"  

### 6.2 Loading State (Skeleton)

```
┌──────────────────────────────────────────┐
│  📰 O QUE ACONTECEU HOJE                 │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ████████████████████████████      │ │  skeleton bar: bg surface-2
│  │  ████████                          │ │  animate: shimmer (gradient sweep)
│  │                                    │ │
│  │  ████████████████████████████████  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ████████████████████████████      │ │
│  │  ████████                          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ████████████████████████████      │ │
│  │  ████████                          │ │
│  └────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

**Skeleton Spec:**
- bg: linear-gradient(90deg, surface-2 25%, transparent 50%, surface-2 75%)
- animate: shimmer (keyframe transladar x de -100% a 100% em 1.5s)
- border-radius: 6px
- Altura: 80px por card
- Largura variável: 70-90% do container

### 6.3 Error State

```
┌──────────────────────────────────────────┐
│                                          │
│  ⚠️ Não foi possível carregar            │  icon: warning triangle
│  os dados da Copa agora.                 │  fs: 14px, color: amber
│                                          │
│  [Tentar novamente]                       │  button: outline
│                                          │
└──────────────────────────────────────────┘
```

**Comportamento:**
- Aparece no lugar do conteúdo que falhou
- Não quebra a página inteira — apenas a seção afetada
- Botão "Tentar novamente" recarrega apenas aquela seção

### 6.4 Hover States

| Elemento | Efeito |
|---|---|
| Card | border-color: acent hover (rgba 99,102,241,.3) • translateY(-1px) • transition: 200ms ease |
| Botão | opacidade 80% no hover |
| Link | Color: acent-2 • text-decoration: underline |
| Table row | bg: rgba(255,255,255,.02) |

### 6.5 Tap/Active States (Mobile)

| Elemento | Efeito |
|---|---|
| Card tap | background: rgba(99,102,241,.08) |
| Scale tap | transform: scale(.98) por 100ms |

---

## 7. Mobile-Specific Behaviors

### Touch Targets
- Mínimo 44x44px para qualquer interação (links, botões)
- Cards: área de toque = card inteiro

### Swipe
- What Happened Today: swipe horizontal opcional para "ver mais"
- Standings group selector: swipe horizontal entre grupos

### Pull to Refresh
- Native pull-to-refresh da página (recarrega dados)
- Indicador de carregamento no topo

### Bottom Bar (futuro)
- Se houver navegação inferior: "Home" | "Jogos" | "Tabelas"
- h: 64px com safe area inset para iPhone X+
- Ícones + labels

---

## 8. Desktop-Specific Behaviors

### Two-Column Layout

```
┌────────────────────┬───────────────────┐
│  HERO              │  LIVE MATCHES     │  row 1: hero spans both
│  (full width)      │  (mini cards)     │  only if there's live games
├────────────────────┼───────────────────┤
│  WHAT HAPPENED     │  QUICK STANDINGS  │  row 2: content + sidebar
│  (cards verticais) │  (compact table)  │
│                    │                   │
│                    │  UPCOMING (teaser)│
└────────────────────┴───────────────────┘
```

**Grid CSS mental model:**
```css
grid-template-columns: 1.5fr 1fr;
grid-template-rows: auto;
gap: 32px;
```

### Nav Bar Desktop
- Logo + "Copa Pulse" à esquerda
- Links: "Sobre" | "Compartilhar" à direita
- Sticky, backdrop-filter: blur(20px)

### Hover Preview (futuro)
- Ao passar mouse sobre card "What Happened", mostrar tooltip com stats adicionais
- Ao passar mouse sobre jogo "ao vivo", expandir com mini-estatísticas (posse, chutes)

---

## 9. Component Data Flow

```
[Importance Score API]
       ↓
[Generates prompt com top 3+ matches]
       ↓
[OpenAI → JSON: { headline, items: [{ match_id, title, context, why_it_matters }] }]
       ↓
[Supabase: armazena bulletin do dia]
       ↓
[Next.js ISR: revalida página]
       ↓
[Homepage renderiza na ordem:
  1. Hero (headline do bulletin.hero)
  2. What Happened (bulletin.items)
  3. Matches (db.matches onde status = live | upcoming)
  4. Standings (db.standings ordenado por points desc)]
```

### Edge Cases

| Caso | Comportamento |
|---|---|
| Dia sem jogos (folga) | Hero mostra "Dia de folga na Copa" • What Happened vazio com mensagem "Hoje não houve jogos" • Matches mostra próximos |
| 8+ jogos no mesmo dia | importance_score filtra top 3-5. Link "Ver todos os jogos →" no final |
| Jogo ao vivo + encerrados misturados | Ao vivo sempre primeiro. Encerrados ordenados por importance_score desc |
| API-Football offline | Cache do último fetch válido. Badge amarelo "Dados podem estar desatualizados" |
| IA falha ao gerar boletim | Fallback: texto genérico com resultados crus. Sem Why It Matters. |

---

## 10. Accessibility

- **Color contrast:** Todo texto atende AA (4.5:1 normal, 3:1 large)
- **Focus states:** Outline visível (2px solid accent, offset 2px) em todos os elementos interativos
- **ARIA labels em:** Nav, cards clicáveis, botões de compartilhar, seções
- **Role regions:** `banner` (nav), `main` (conteúdo), `complementary` (standings sidebar)
- **Alt text:** Flags em texto (ex: "Bandeira do Brasil") via emoji com `role="img"` e `aria-label`
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` → desliga shimmer/skeleton animações

---

## 11. Performance Targets

| Métrica | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 1.5s mobile |
| FCP (First Contentful Paint) | < 0.8s |
| TBT (Total Blocking Time) | < 100ms |
| First Load JS | < 150kb |
| Lighthouse Performance | > 90 |

---

Este documento é auto-suficiente para implementação. Qualquer dúvida de implementação deve ser resolvida consultando a hierarquia visual definida na seção 2 — o que importa primeiro determina o layout, não o contrário.
