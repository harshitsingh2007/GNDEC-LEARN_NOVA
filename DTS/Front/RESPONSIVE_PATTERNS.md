# Responsive Design Patterns

This document outlines the responsive design patterns used throughout the application to ensure it works on all devices including mobile.

## Breakpoints

- **Mobile**: Default (< 640px)
- **sm**: Small devices (≥ 640px)
- **md**: Medium devices (≥ 768px)
- **lg**: Large devices (≥ 1024px)
- **xl**: Extra large devices (≥ 1280px)

## Common Patterns

### Page Container
```tsx
<div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ background: palette.bg }}>
```

### Responsive Headers
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Title</h1>
  <Button className="w-full sm:w-auto">Action</Button>
</div>
```

### Responsive Grids
```tsx
{/* Single column on mobile, 2 on tablet, 3+ on desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

### Responsive Text
```tsx
<p className="text-xs sm:text-sm md:text-base">Text content</p>
<h1 className="text-2xl sm:text-3xl md:text-4xl">Heading</h1>
```

### Responsive Icons
```tsx
<Icon className="w-4 h-4 sm:w-5 sm:h-5" />
```

### Mobile-First Buttons
```tsx
<Button className="w-full sm:w-auto">
  <span className="hidden sm:inline">Full Text</span>
  <span className="sm:hidden">Short</span>
</Button>
```

### Responsive Search/Input
```tsx
<div className="relative w-full sm:max-w-md">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" />
  <Input className="pl-9 sm:pl-10 text-sm" />
</div>
```

### Responsive Cards
```tsx
<Card className="h-full transform hover:scale-[1.02] transition-transform">
  <CardTitle className="text-lg sm:text-xl">Title</CardTitle>
  <p className="text-xs sm:text-sm">Description</p>
</Card>
```

## Key Principles

1. **Mobile-First**: Design for mobile first, then enhance for larger screens
2. **Flexible Layouts**: Use flexbox and grid with responsive breakpoints
3. **Touch-Friendly**: Ensure buttons and interactive elements are at least 44x44px on mobile
4. **Readable Text**: Use responsive text sizes that scale appropriately
5. **Proper Spacing**: Use responsive padding and margins (p-4 sm:p-6 md:p-8)
6. **Stack on Mobile**: Stack elements vertically on mobile, horizontal on desktop
7. **Full-Width on Mobile**: Make inputs and buttons full-width on mobile when appropriate

## Updated Pages

✅ Dashboard (Student & Admin)
✅ History
✅ Courses
✅ Assignments
✅ Admin Assessments
✅ Calendar (partial)
✅ ChatBot (partial)

## Pages Still Needing Updates

- Calendar (full responsive)
- ChatBot (full responsive)
- CreateCourse
- BattleShow
- BattleLive
- Arena
- All auth pages (Login, Signup, Landing, AdminLogin)
- Other admin pages



