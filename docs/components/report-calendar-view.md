# ReportCalendarView Component

## 🧩 Component Implementation

### Component: ReportCalendarView

### Category: Composed Pattern

### File: `src/components/features/reports/report-calendar-view.tsx`

## Overview

The `ReportCalendarView` component provides an advanced calendar visualization
for reports with responsive design. It displays reports on a monthly calendar
grid on desktop and switches to a chronological list view on mobile devices.

## Props Interface

```typescript
interface ReportCalendarViewProps {
  reports: Report[] // Array of reports to display
  onReportClick: (report: Report) => void // Handler when report is clicked
  onReportEdit?: (report: Report) => void // Optional: Handler for edit action
  onReportDelete?: (report: Report) => void // Optional: Handler for delete action
  className?: string // Optional: Additional CSS classes
}
```

## Features

### Desktop View (≥768px)

1. **Monthly Calendar Grid**
   - 7-column grid (Monday to Sunday)
   - Displays all days of the month
   - Grayed out days from adjacent months
   - Highlighted current day with primary color

2. **Navigation**
   - Month selector dropdown (January - December)
   - Year selector dropdown (±5 years from current)
   - Previous/Next month buttons
   - "Today" button to jump to current date

3. **Report Display in Cells**
   - Up to 2 reports shown per day
   - Color-coded by type:
     - Weekly: Green (`bg-green-500`)
     - Monthly: Purple (`bg-purple-500`)
     - Individual: Orange (`bg-orange-500`)
   - Format icon (PDF/Word/Excel)
   - Truncated title
   - "+X autres" indicator if more than 2 reports

4. **Report Count Badge**
   - Displays total count of reports per day
   - Secondary variant badge

5. **Hover/Click Popover**
   - Shows on days with reports
   - Displays full list of reports for that day
   - Each report shows:
     - Title
     - Type badge (color-coded)
     - Format badge
     - Period
     - Author name
     - Actions menu (View/Edit/Delete)

6. **Legend**
   - Color-coded type indicators
   - Displays at bottom of calendar

### Mobile View (<768px)

1. **List View**
   - Grouped by date (newest first)
   - Limited to 20 most recent days
   - Each day section shows:
     - Date header (highlighted if today)
     - Report count badge
     - Report cards

2. **Report Cards**
   - Color-coded indicator dot
   - Title
   - Type and format badges
   - Period
   - Actions dropdown menu

3. **Empty State**
   - Calendar icon
   - "Aucun rapport à afficher" message

## Usage Example

### Basic Usage

```typescript
import { ReportCalendarView } from "@/components/features/reports/report-calendar-view";

export default function ReportsPage() {
  const reports = await getReports();

  return (
    <ReportCalendarView
      reports={reports}
      onReportClick={(report) => console.log("View:", report)}
    />
  );
}
```

### With Edit and Delete Actions

```typescript
import { ReportCalendarView } from "@/components/features/reports/report-calendar-view";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState([...]);

  const handleEdit = (report: Report) => {
    router.push(`/dashboard/reports/${report.id}/edit`);
  };

  const handleDelete = async (report: Report) => {
    if (confirm("Supprimer ce rapport ?")) {
      await deleteReport(report.id);
      setReports(reports.filter(r => r.id !== report.id));
    }
  };

  return (
    <ReportCalendarView
      reports={reports}
      onReportClick={(report) => router.push(`/dashboard/reports/${report.id}`)}
      onReportEdit={handleEdit}
      onReportDelete={handleDelete}
    />
  );
}
```

### Server Component Integration

```typescript
// app/dashboard/reports/calendar/page.tsx
import { ReportCalendarView } from "@/components/features/reports/report-calendar-view";
import { getReports } from "@/actions/report.actions";

export default async function ReportCalendarPage() {
  const { data: reports } = await getReports();

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Calendrier des rapports</h1>

      <ReportCalendarView
        reports={reports || []}
        onReportClick={(report) => {
          "use client";
          window.location.href = `/dashboard/reports/${report.id}`;
        }}
      />
    </div>
  );
}
```

## Component Variants

### Type Colors

| Type       | Background Color | Hover Color           |
| ---------- | ---------------- | --------------------- |
| WEEKLY     | `bg-green-500`   | `hover:bg-green-600`  |
| MONTHLY    | `bg-purple-500`  | `hover:bg-purple-600` |
| INDIVIDUAL | `bg-orange-500`  | `hover:bg-orange-600` |
| Default    | `bg-blue-500`    | `hover:bg-blue-600`   |

### Format Icons

| Format | Icon                  | Label |
| ------ | --------------------- | ----- |
| pdf    | `<FileText />`        | PDF   |
| word   | `<FileType />`        | Word  |
| excel  | `<FileSpreadsheet />` | Excel |

### Badge Variants

| Type       | Variant     |
| ---------- | ----------- |
| WEEKLY     | `default`   |
| MONTHLY    | `secondary` |
| INDIVIDUAL | `outline`   |

## Accessibility

- ✅ Keyboard navigation
  - Tab through interactive elements
  - Enter/Space to activate buttons
  - Escape to close popovers

- ✅ ARIA attributes
  - Proper button roles
  - Semantic HTML structure
  - Accessible dropdowns and popovers

- ✅ Focus management
  - Visible focus indicators
  - Logical tab order
  - Focus trap in popovers

- ✅ Screen reader support
  - Descriptive labels
  - Date announcements
  - Report count announcements

## Responsive Behavior

### Breakpoints

| Breakpoint | Behavior              |
| ---------- | --------------------- |
| `< 768px`  | Mobile list view      |
| `≥ 768px`  | Desktop calendar grid |

### Layout Changes

**Desktop (≥768px):**

- 7-column calendar grid
- Each day cell: `min-h-[120px]`
- Gap: `gap-2`
- Popover on hover/click

**Mobile (<768px):**

- Single column list
- Grouped by date
- Card-based layout
- Bottom sheet for actions

## Performance Optimizations

1. **useMemo for Date Grouping**

   ```typescript
   const reportsByDate = useMemo(() => {
     const map = new Map<string, Report[]>()
     reports.forEach((report) => {
       const dateKey = format(new Date(report.createdAt), 'yyyy-MM-dd')
       const existing = map.get(dateKey) || []
       map.set(dateKey, [...existing, report])
     })
     return map
   }, [reports])
   ```

2. **Debounced Resize Listener**
   - Prevents excessive re-renders on window resize

3. **Lazy Rendering**
   - Only renders visible days in viewport

4. **Event Delegation**
   - Single click handler per day instead of per report

## Dependencies

### UI Components (shadcn/ui)

- `Card`, `CardContent`, `CardHeader`
- `Button`
- `Badge`
- `Popover`, `PopoverContent`, `PopoverTrigger`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, etc.

### Icons (lucide-react)

- `ChevronLeft`, `ChevronRight`
- `Calendar`
- `FileText`, `FileType`, `FileSpreadsheet`
- `MoreHorizontal`
- `Edit`, `Trash2`, `Eye`

### Date Utilities (date-fns)

- `format`, `startOfMonth`, `endOfMonth`
- `eachDayOfInterval`, `isSameMonth`, `isSameDay`
- `addMonths`, `subMonths`, `getDay`
- `startOfWeek`, `endOfWeek`
- `getYear`, `setMonth`, `setYear`

### Locale

- `fr` from `date-fns/locale`

## Testing

See `report-calendar-view.test.tsx` for comprehensive unit tests including:

- ✅ Desktop calendar rendering
- ✅ Mobile list rendering
- ✅ Navigation interactions
- ✅ Report click handlers
- ✅ Edit/Delete actions
- ✅ Responsive behavior
- ✅ Empty state
- ✅ Accessibility compliance

## Example Files

- **Component**: `src/components/features/reports/report-calendar-view.tsx`
- **Example**:
  `src/components/features/reports/report-calendar-view.example.tsx`
- **Tests**: `src/components/features/reports/report-calendar-view.test.tsx`
- **Documentation**: `docs/components/report-calendar-view.md`

## Migration from report-calendar.tsx

If migrating from the simpler `report-calendar.tsx`:

1. Replace import:

   ```typescript
   // Old
   import { ReportCalendar } from '@/components/features/reports/report-calendar'

   // New
   import { ReportCalendarView } from '@/components/features/reports/report-calendar-view'
   ```

2. Add optional handlers:

   ```typescript
   <ReportCalendarView
     reports={reports}
     onReportClick={handleClick}
     onReportEdit={handleEdit}      // New
     onReportDelete={handleDelete}  // New
   />
   ```

3. Update responsive handling - now automatic (no manual detection needed)

## Future Enhancements

- [ ] Week view mode
- [ ] Year view mode
- [ ] Export calendar to PDF/Excel
- [ ] Filter reports by type/format in calendar
- [ ] Drag and drop to reschedule reports
- [ ] Multi-select for bulk actions
- [ ] Custom color schemes
- [ ] Print-friendly layout
- [ ] Integration with external calendars (iCal, Google Calendar)

## Troubleshooting

### Reports not showing on correct dates

**Issue**: Reports appear on wrong calendar days

**Solution**: Ensure `createdAt` is a valid Date object:

```typescript
const reports = data.map((r) => ({
  ...r,
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt),
}))
```

### Mobile view not activating

**Issue**: Calendar grid shows on mobile

**Solution**: Check window resize event listener is working:

```typescript
// Component uses window.innerWidth < 768
// Ensure no SSR issues with useEffect
```

### Popover not closing

**Issue**: Popover stays open when clicking outside

**Solution**: Radix Popover handles this automatically. Check for
event.stopPropagation() conflicts.

## Support

For issues or questions:

- Check example file: `report-calendar-view.example.tsx`
- Run tests: `pnpm test report-calendar-view.test.tsx`
- Review documentation: This file

---

**Last Updated**: 2026-01-22 **Component Version**: 1.0.0 **Maintained by**:
Développeur Composants
