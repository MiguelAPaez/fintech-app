# Pulse — Design System

## Product context
Pulse is a simulated personal-finance app for Gen Z / young adults (18–28). Portfolio project: must impress in the first 10 seconds.
Jobs to be done: "show me where my money went", "don't let me miss a bill", "help me save for something I want".
Key pages: Welcome carousel (4 slides), Login/Register, Setup wizard, Dashboard, Transactions (table + filters), Accounts, Payments (bills), Goals, Settings.
Data is entered manually; everything is fake/simulated. Currency default USD.

## Personality
Playful, confident, a bit loud — like a music/streaming app, not a bank. Casual, encouraging copy ("You spent 12% less on food 🔥", "Crush your goals 🎯"). Emoji are first-class: category icons and goal icons are emoji, not icon fonts.

## Color (dark-first)
| Token | Dark (default) | Light | Use |
|---|---|---|---|
| --bg | #0E0E1A | #F6F5FB | app background (ink) |
| --surface | #171728 | #FFFFFF | cards |
| --surface-2 | #20203A | #EFEDF8 | inputs, table rows hover, chips |
| --border | #2A2A45 | #E2DFF0 | 1px hairlines |
| --text | #F4F3FF | #14142B | primary text |
| --text-muted | #9A98B8 | #5E5C7A | labels, secondary |
| --violet | #7C5CFF | #6A48F5 | primary brand, primary buttons, active nav, balance chart |
| --lime | #C6F432 | #7FA300 | income, positive numbers, success, "paid" |
| --pink | #FF5CA8 | #E63E8C | expenses, negative, "overdue", alerts |
| --amber | #FFB547 | #D98A00 | "upcoming" status, warnings |
| --cyan | #3FD8FF | #0096C7 | extra chart series |

Gradients (hero cards, welcome slides, primary CTA only):
- --grad-hero: linear-gradient(135deg, #7C5CFF 0%, #FF5CA8 100%)
- --grad-lime: linear-gradient(135deg, #C6F432 0%, #3FD8FF 100%)

Category chart palette (in order): violet, pink, lime, cyan, amber, #A78BFA, #FF8A65, #4ADE80, #F472B6, #94A3B8.
Text on lime must be ink #0E0E1A (lime is light). Text on violet/pink/gradient is white.

## Typography
- Display / numbers: "Space Grotesk", 600–700. Big balance numbers 40–56px, tight letter-spacing -0.02em, tabular numbers.
- Body / UI: "Inter", 400–600, 14–16px base.
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 48.
- Labels: 12px uppercase, letter-spacing 0.08em, --text-muted.

## Shape, spacing, depth
- Radius: cards 20px, buttons/inputs 14px, chips/badges 999px (pill), modal 24px.
- Spacing scale (px): 4, 8, 12, 16, 20, 24, 32, 48. Card padding 20px mobile / 24px desktop. Grid gap 16px mobile / 20px desktop.
- Shadows: subtle, colored glow instead of grey: `0 8px 32px rgba(124,92,255,0.18)` on hero/hovered cards. Default cards: no shadow, 1px --border.
- No glassmorphism overload; at most one blurred gradient blob behind the hero.

## Components
- **Button**: primary = violet fill, white text, 14px radius, 44px height; secondary = --surface-2 fill; ghost = text only; danger = pink. Floating quick-add "+" = 56px circle with --grad-hero and glow.
- **Card**: --surface, 1px --border, 20px radius.
- **KPI tile**: label (uppercase muted) + big Space Grotesk number + delta chip (lime ▲ / pink ▼).
- **Chip / Badge**: pill; status colors paid=lime, upcoming=amber, overdue=pink; category chip = emoji + name on --surface-2.
- **Input/Select**: --surface-2 fill, no border until focus, focus ring 2px violet.
- **Table (desktop)**: no vertical lines, 56px rows, emoji avatar circle for category, amount right-aligned (income lime with "+", expense default text with "−").
- **Transaction card (mobile)**: emoji circle, description + category/date line, amount on right.
- **Navigation**: desktop left sidebar 240px (logo "Pulse" wordmark with a small pulse/heartbeat line mark, nav items with icon + label, active = violet pill). Mobile bottom tab bar 5 items: Home, Activity, center floating "+", Bills, More.
- **Charts (D3)**: thin 2px lines, area fill gradient violet→transparent, rounded bar tops (4px), donut with 70% inner radius and total in the center, minimal axes (muted 12px labels, no axis lines, faint horizontal gridlines), tooltips as small dark pills.
- **Progress ring**: 10px stroke, violet→pink gradient, percentage in center.

## Layout
- Mobile-first. <768px: single column, top bar (avatar + greeting + bell), bottom tab bar.
- 768–1199px: sidebar + 2-column grid.
- ≥1200px: sidebar + 3-column dashboard grid, max content width 1280px.

## Motion
- 200ms ease-out for hover/press; cards lift 2px on hover.
- Balance numbers count up on load (600ms).
- Charts draw in (line stroke-dashoffset, bars grow from baseline, donut arcs sweep) ~600ms.
- Welcome carousel slides: horizontal slide + fade 300ms.
- Respect prefers-reduced-motion (disable all of the above).

## Constraints
- Implementation is hand-written CSS (no Tailwind/UI kit) — designs should use simple, reproducible CSS.
- Accessible contrast (WCAG AA) on all text; never convey status by color alone (add label/icon).
