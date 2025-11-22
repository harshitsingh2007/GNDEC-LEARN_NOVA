# Theme Update Guide

## Centralized Theme
All pages should import and use the centralized theme from `@/theme/palette`:

```typescript
import { palette } from '@/theme/palette';
```

## Color Mapping

### Backgrounds
- `bg-white` → `style={{ background: palette.bg }}`
- `bg-black` → `style={{ background: palette.accent }}` (for buttons)
- `bg-gray-50`, `bg-gray-100` → `style={{ background: palette.cardHover }}`

### Text Colors
- `text-black` → `style={{ color: palette.text }}`
- `text-gray-700` → `style={{ color: palette.text }}`
- `text-gray-600` → `style={{ color: palette.text2 }}`
- `text-gray-500` → `style={{ color: palette.text2 }}`
- `text-gray-400` → `style={{ color: palette.text2 }}`

### Borders
- `border-gray-200` → `style={{ borderColor: palette.border }}`
- `border-gray-300` → `style={{ borderColor: palette.border }}`
- `border-black` → `style={{ borderColor: palette.accent }}`

### Cards
- `bg-white border border-gray-200` → `style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}`

### Buttons
- `bg-black hover:bg-gray-800` → `style={{ background: palette.accent }}` with `onMouseEnter/Leave` handlers
- Primary buttons: `palette.accent` → `palette.accentDeep` on hover
- Secondary buttons: `palette.accentSoft` background

### Progress Bars
- Progress track: `palette.progressTrack`
- Progress fill: `palette.progressFill`

## Common Patterns

### Page Container
```tsx
<div className="p-8 space-y-8" style={{ background: palette.bg }}>
```

### Card Component
```tsx
<Card style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
```

### Button with Hover
```tsx
<Button
  style={{ background: palette.accent, color: palette.card }}
  onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
  onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
>
```

### Input Field
```tsx
<Input
  style={{ 
    color: palette.text, 
    borderColor: palette.border, 
    backgroundColor: palette.card,
    '--tw-ring-color': palette.accent + '33'
  } as React.CSSProperties & { '--tw-ring-color': string }}
/>
```

## Files Updated
- ✅ `Front/src/theme/palette.ts` - Centralized theme
- ✅ `Front/src/pages/student/Dashboard.tsx`
- ✅ `Front/src/pages/Login.tsx`
- ✅ `Front/src/pages/Landing.tsx`
- ✅ `Front/src/pages/Signup.tsx`
- ✅ `Front/src/pages/admin/AdminLogin.tsx`

## Files Remaining
All other pages in:
- `Front/src/pages/student/`
- `Front/src/pages/admin/`
- `Front/src/pages/` (other auth pages)

Apply the same pattern to all remaining pages.

