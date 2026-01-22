# Reports Page Redesign - Architecture Document

**ADR-ID**: ADR-2026-001 **Status**: Proposed **Date**: 2026-01-22 **Author**:
Architecture Director **Stakeholders**: Product Owner, Frontend Lead, UX
Designer

---

## Executive Summary

This document outlines the architectural transformation of the Reports module
from a modal-based editing experience to a full-page, multi-view application.
The redesign addresses current limitations in content editing space, introduces
a comprehensive statistics dashboard, and establishes a scalable component
architecture aligned with Next.js 16 and React 19 best practices.

---

## 1. Current State Analysis

### Existing Architecture

```
/dashboard/reports/
  page.tsx           # Client component - reports list + modal editor
  layout.tsx         # Standard layout wrapper
  loading.tsx        # Loading skeleton
  /templates/
    page.tsx         # Template management
  /monthly/
    page.tsx         # Monthly reports specific view

/components/features/
  report-editor-dialog.tsx      # Modal editor (limited space)
  report-export-menu.tsx        # Export dropdown menu

/components/features/reports/
  report-stats.tsx              # Stats cards (exists but underutilized)
  report-filters.tsx            # Filter panel (exists)
  report-table.tsx              # Table view (exists)
  report-calendar.tsx           # Calendar view (exists)
  report-preview-dialog.tsx     # Preview modal (exists)
  report-skeleton.tsx           # Loading states (exists)
```

### Current Limitations

| Issue                    | Impact                                          | Priority |
| ------------------------ | ----------------------------------------------- | -------- |
| Modal-based editor       | Limited editing space, poor UX for long content | Critical |
| No report detail page    | Cannot share/bookmark specific reports          | High     |
| Statistics underutilized | Dashboard lacks data insights                   | Medium   |
| No grid view             | Missing visual alternative to table             | Low      |
| No draft support         | Users cannot save work in progress              | Medium   |

---

## 2. Target Architecture

### 2.1 Route Structure

```
/dashboard/reports/
  page.tsx              # Main reports dashboard (Server Component)
  layout.tsx            # Reports-specific layout
  loading.tsx           # Page-level skeleton

  /new/
    page.tsx            # Full-page report creator

  /[id]/
    page.tsx            # Report detail/preview page
    /edit/
      page.tsx          # Full-page report editor (reuses new page logic)

  /templates/
    page.tsx            # Template management (existing)
    /[id]/
      page.tsx          # Template detail

  /monthly/
    page.tsx            # Monthly reports (existing)
```

### 2.2 Component Hierarchy Diagram

```
                                   ReportsLayout
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
             ReportsPage          ReportNewPage       ReportDetailPage
                    |                   |                   |
    +---------------+-------+     +-----+-----+       +-----+-----+
    |               |       |     |           |       |           |
ReportStats   ReportFilters |  MetadataSidebar  EditorMain   PreviewPanel
    |               |       |     |           |       |           |
StatCard[]    FilterGroup   |  TemplateSelect  |   RichEditor   ExportOptions
              ViewToggle    |  PeriodPicker    |       |        SharePanel
                    |       |  FormatSelect    |   TiptapEditor VersionHistory
    +---------------+       |       |          |
    |       |       |       |   DraftManager   |
TableView  GridView CalendarView               |
    |       |       |                     PreviewPanel (optional)
RowActions CardActions DayCell
```

### 2.3 Data Flow Architecture

```
                    +-----------------------+
                    |   Next.js App Router  |
                    +-----------+-----------+
                                |
            +-------------------+-------------------+
            |                                       |
    Server Components                       Client Components
            |                                       |
    +-------+-------+                       +-------+-------+
    |               |                       |               |
getUserReports  getReportById          useAction hooks  Local State
(cached)        (cached)                    |               |
    |               |                       v               v
    v               v                   Mutations      UI State
+---+---------------+---+               (create,       (filters,
|    Prisma Database    |                update,       viewMode,
+-----------------------+                delete)       selections)
            |
    +-------+-------+
    |               |
  Report      ReportTemplate
            |
      ReportRecipient
```

---

## 3. Component Specifications

### 3.1 Main Reports Page Components

#### `report-stats-dashboard.tsx` (Server Component)

```typescript
interface ReportStatsDashboardProps {
  stats: ReportStats
}
// Renders 4-6 stat cards with animations
// Uses Suspense boundary for streaming
```

#### `report-filters-panel.tsx` (Client Component)

```typescript
interface ReportFiltersPanelProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  isCollapsed: boolean
  onCollapseChange: (collapsed: boolean) => void
}
// Collapsible advanced filters
// Includes: search, type, format, period, date range
// Persists state to URL params
```

#### `report-view-switcher.tsx` (Client Component)

```typescript
type ViewMode = 'list' | 'calendar' | 'grid'
interface ReportViewSwitcherProps {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
}
// Toggle between list, calendar, and grid views
```

#### `report-grid-view.tsx` (Client Component)

```typescript
interface ReportGridViewProps {
  reports: Report[]
  onReportClick: (report: Report) => void
  onQuickAction: (action: QuickAction, report: Report) => void
}
// Card-based grid layout
// Responsive: 1-4 columns based on viewport
// Quick actions on hover
```

#### `report-quick-actions.tsx` (Client Component)

```typescript
interface ReportQuickActionsProps {
  report: Report
  variant: 'inline' | 'dropdown' | 'card'
  onAction: (action: QuickAction) => void
}
// Actions: Edit, Preview, Export, Duplicate, Delete
// Context-aware (different for table vs grid)
```

#### `report-empty-state.tsx` (Client Component)

```typescript
interface ReportEmptyStateProps {
  hasFilters: boolean
  onCreateNew: () => void
  onClearFilters: () => void
}
// Contextual empty state with suggestions
// Different messaging for no reports vs no results
```

### 3.2 Report Editor Page Components

#### `report-editor-full.tsx` (Client Component)

```typescript
interface ReportEditorFullProps {
  report?: Report // undefined for new report
  templates: ReportTemplate[]
  onSave: (data: ReportFormData) => Promise<void>
  onSaveDraft: (data: ReportFormData) => Promise<void>
}
// Three-column layout: metadata | editor | preview
// Autosave draft every 30 seconds
// Full-screen mode option
```

#### `report-metadata-sidebar.tsx` (Client Component)

```typescript
interface ReportMetadataSidebarProps {
  metadata: ReportMetadata
  templates: ReportTemplate[]
  onChange: (metadata: ReportMetadata) => void
}
// Left sidebar containing:
// - Title input
// - Template selector
// - Format dropdown (PDF, Word, Excel)
// - Period picker (date range)
// - Report type selector
// - AI summary toggle
// - Tags input (future)
```

#### `report-preview-panel.tsx` (Client Component)

```typescript
interface ReportPreviewPanelProps {
  content: string
  format: ReportFormat
  isVisible: boolean
  onToggle: () => void
}
// Right sidebar with live preview
// Collapsible to give more editor space
// Renders HTML preview of report content
```

#### `report-rich-editor.tsx` (Client Component)

```typescript
interface ReportRichEditorProps {
  content: string
  onChange: (content: string) => void
  onInsertData: (dataType: 'timesheet' | 'tasks') => void
}
// Full-width TipTap editor
// Custom toolbar for report-specific actions
// Insert data blocks (timesheets, tasks)
// Table support for structured data
```

### 3.3 Report Detail Page Components

#### `report-detail-header.tsx` (Client Component)

```typescript
interface ReportDetailHeaderProps {
  report: Report
  onEdit: () => void
  onExport: (format: ExportFormat) => void
  onShare: () => void
  onDelete: () => void
}
// Report title, metadata, action buttons
// Breadcrumb navigation back to list
```

#### `report-content-viewer.tsx` (Client Component)

```typescript
interface ReportContentViewerProps {
  content: string
  format: ReportFormat
}
// Read-only rich content display
// Print-friendly styles
```

#### `report-share-panel.tsx` (Client Component)

```typescript
interface ReportSharePanelProps {
  report: Report
  recipients: ReportRecipient[]
  onSend: (emails: string[]) => Promise<void>
}
// Email recipients management
// Send report as attachment
// Copy shareable link (future)
```

---

## 4. State Management

### 4.1 Server State (React Query / next-safe-action)

```typescript
// Cache Tags for Invalidation
const REPORT_CACHE_TAGS = {
  LIST: 'reports-list',
  DETAIL: (id: string) => `report-${id}`,
  STATS: 'reports-stats',
  TEMPLATES: 'report-templates',
} as const

// Query Keys
const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: ReportFilters) => [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  stats: () => [...reportKeys.all, 'stats'] as const,
}
```

### 4.2 Client State (URL + React State)

```typescript
// URL State (persisted across navigation)
interface ReportURLState {
  search?: string
  type?: ReportType
  format?: ReportFormat
  period?: 'all' | 'thisMonth' | 'thisYear' | 'custom'
  startDate?: string
  endDate?: string
  view?: ViewMode
}

// Local Component State (transient)
interface ReportLocalState {
  selectedIds: string[]
  deleteDialogOpen: boolean
  reportToDelete: string | null
}
```

### 4.3 Form State (React Hook Form + Zod)

```typescript
// Report Editor Form Schema
const reportFormSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  content: z.string(),
  format: z.enum(['pdf', 'word', 'excel']),
  period: z.string().optional(),
  templateId: z.string().optional(),
  reportType: z.enum(['WEEKLY', 'MONTHLY', 'INDIVIDUAL']).optional(),
  includeSummary: z.boolean().default(false),
  isDraft: z.boolean().default(false),
})
```

---

## 5. Performance Considerations

### 5.1 Partial Prerendering (PPR)

```typescript
// Main reports page structure for PPR
export default async function ReportsPage() {
  // Static shell
  return (
    <div className="flex flex-col gap-6">
      {/* Static: Page header */}
      <ReportsHeader />

      {/* Dynamic: Stats from database */}
      <Suspense fallback={<ReportStatsSkeleton />}>
        <ReportStatsDashboard />
      </Suspense>

      {/* Client: Interactive filters */}
      <ReportsClientSection />
    </div>
  );
}
```

### 5.2 Caching Strategy

| Data          | Cache Duration | Invalidation Trigger   |
| ------------- | -------------- | ---------------------- |
| Reports list  | 60s            | Create, Update, Delete |
| Report detail | 300s           | Update, Delete         |
| Stats         | 300s           | Any report mutation    |
| Templates     | 3600s          | Template CRUD          |

```typescript
// Cached data fetching
import { unstable_cache } from 'next/cache'
import { CacheTags, CacheDuration } from '@/lib/cache'

const getCachedReportStats = unstable_cache(
  async (userId: string) => {
    return prisma.report.aggregate({
      where: { createdById: userId },
      // ... aggregation
    })
  },
  ['report-stats'],
  {
    revalidate: CacheDuration.MEDIUM,
    tags: [CacheTags.REPORTS],
  },
)
```

### 5.3 Code Splitting

```typescript
// Dynamic imports for heavy components
const ReportRichEditor = dynamic(
  () => import('@/components/features/reports/report-rich-editor'),
  {
    loading: () => <EditorSkeleton />,
    ssr: false // TipTap requires client-side rendering
  }
);

const ReportCalendarView = dynamic(
  () => import('@/components/features/reports/report-calendar-view'),
  { loading: () => <CalendarSkeleton /> }
);
```

### 5.4 Optimistic Updates

```typescript
// Optimistic deletion with rollback
const deleteReportMutation = useMutation({
  mutationFn: deleteReport,
  onMutate: async (reportId) => {
    await queryClient.cancelQueries({ queryKey: reportKeys.lists() })
    const previousReports = queryClient.getQueryData(reportKeys.lists())

    queryClient.setQueryData(reportKeys.lists(), (old) =>
      old?.filter((r) => r.id !== reportId),
    )

    return { previousReports }
  },
  onError: (err, reportId, context) => {
    queryClient.setQueryData(reportKeys.lists(), context?.previousReports)
    toast.error('Failed to delete report')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: reportKeys.lists() })
  },
})
```

---

## 6. Migration Plan

### Phase 1: Foundation (Week 1)

| Task                   | Owner    | Deliverable                                |
| ---------------------- | -------- | ------------------------------------------ |
| Create route structure | Frontend | `/new`, `/[id]`, `/[id]/edit` routes       |
| Update types           | Frontend | Extended `ReportFilters`, `ReportFormData` |
| Add cache tags         | Frontend | `CacheTags.REPORTS` integration            |

### Phase 2: Components (Week 2)

| Task             | Owner    | Deliverable                   |
| ---------------- | -------- | ----------------------------- |
| Full-page editor | Frontend | `report-editor-full.tsx`      |
| Metadata sidebar | Frontend | `report-metadata-sidebar.tsx` |
| Grid view        | Frontend | `report-grid-view.tsx`        |
| Preview panel    | Frontend | `report-preview-panel.tsx`    |

### Phase 3: Integration (Week 3)

| Task            | Owner    | Deliverable           |
| --------------- | -------- | --------------------- |
| Connect actions | Frontend | Wire up mutations     |
| URL state sync  | Frontend | Filters in URL params |
| Autosave draft  | Frontend | 30s interval save     |
| Loading states  | Frontend | All skeletons         |

### Phase 4: Polish (Week 4)

| Task               | Owner    | Deliverable           |
| ------------------ | -------- | --------------------- |
| Keyboard shortcuts | Frontend | Ctrl+S, Escape, etc.  |
| Mobile responsive  | Frontend | Tablet/mobile layouts |
| E2E tests          | QA       | Playwright tests      |
| Documentation      | Frontend | Component docs        |

---

## 7. API Requirements

### 7.1 New Server Actions Required

```typescript
// report.actions.ts additions

/**
 * Get paginated reports with filters
 */
export const getFilteredReports = authActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput, ctx }) => {
    /* ... */
  })

/**
 * Get report statistics
 */
export const getReportStats = authActionClient.action(async ({ ctx }) => {
  /* ... */
})

/**
 * Save report as draft
 */
export const saveDraft = authActionClient
  .schema(draftReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    /* ... */
  })

/**
 * Publish draft report
 */
export const publishDraft = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    /* ... */
  })
```

### 7.2 Schema Extensions

```typescript
// Prisma schema additions
model Report {
  // ... existing fields
  isDraft     Boolean   @default(false)
  publishedAt DateTime?
  draftData   Json?     // Autosave content
}
```

---

## 8. Security Considerations

| Concern        | Mitigation                                   |
| -------------- | -------------------------------------------- |
| Report access  | Ownership check on all read/write operations |
| XSS in content | DOMPurify sanitization (already implemented) |
| CSRF           | next-safe-action CSRF protection             |
| Rate limiting  | Applied via `authActionClient`               |

---

## 9. Accessibility Requirements

- Keyboard navigation for all views (list, grid, calendar)
- ARIA labels on interactive elements
- Focus management when opening/closing panels
- Screen reader announcements for state changes
- Color contrast compliance (WCAG 2.1 AA)

---

## 10. Testing Strategy

### Unit Tests (Vitest)

- Component rendering tests
- Form validation tests
- State management tests

### Integration Tests (Vitest + Testing Library)

- Filter interactions
- View mode switching
- CRUD operations

### E2E Tests (Playwright)

- Complete report creation flow
- Edit existing report
- Export functionality
- Mobile responsiveness

---

## 11. Success Metrics

| Metric                  | Current      | Target       |
| ----------------------- | ------------ | ------------ |
| Time to create report   | ~90s         | < 60s        |
| Editor usable area      | 40% viewport | 80% viewport |
| Page load time          | ~2s          | < 1s (PPR)   |
| User satisfaction (NPS) | TBD          | > 50         |

---

## 12. Risks and Mitigations

| Risk                        | Probability | Impact | Mitigation                     |
| --------------------------- | ----------- | ------ | ------------------------------ |
| TipTap bundle size          | Medium      | Medium | Dynamic import, lazy load      |
| Breaking existing workflows | Low         | High   | Feature flag, gradual rollout  |
| Mobile editor usability     | High        | Medium | Simplified mobile layout       |
| Draft data loss             | Medium      | High   | Autosave + localStorage backup |

---

## 13. Component File Structure (Final)

```
src/components/features/reports/
  index.ts                      # Barrel exports

  # Dashboard Components
  report-stats-dashboard.tsx    # NEW - Stats cards with animations
  report-filters-panel.tsx      # ENHANCED - Collapsible filters
  report-view-switcher.tsx      # NEW - List/Grid/Calendar toggle
  report-grid-view.tsx          # NEW - Card-based grid
  report-table-view.tsx         # RENAMED from report-table.tsx
  report-calendar-view.tsx      # RENAMED from report-calendar.tsx
  report-quick-actions.tsx      # NEW - Inline action buttons
  report-empty-state.tsx        # NEW - Empty state with CTA

  # Editor Components
  report-editor-full.tsx        # NEW - Full-page editor layout
  report-metadata-sidebar.tsx   # NEW - Left sidebar (metadata)
  report-preview-panel.tsx      # ENHANCED - Right sidebar (preview)
  report-rich-editor.tsx        # NEW - TipTap wrapper
  report-draft-manager.tsx      # NEW - Autosave logic

  # Detail Page Components
  report-detail-header.tsx      # NEW - Header with actions
  report-content-viewer.tsx     # NEW - Read-only display
  report-share-panel.tsx        # NEW - Email/share functionality
  report-version-history.tsx    # FUTURE - Version timeline

  # Shared
  report-skeleton.tsx           # ENHANCED - All loading states
  report-types.ts               # TypeScript interfaces
```

---

## 14. Sign-off

- [ ] Architecture Director - Design approval
- [ ] Frontend Lead - Implementation feasibility
- [ ] UX Designer - User experience validation
- [ ] Security Lead - Security review
- [ ] QA Lead - Testability assessment

---

## Appendix A: Wireframes Reference

### A.1 Main Dashboard Layout

```
+------------------------------------------------------------------+
|  [Header: Breadcrumb]                    [Search] [Theme] [Notif] |
+------------------------------------------------------------------+
|                                                                   |
|  Rapports                                        [+ Nouveau]      |
|                                                                   |
|  +----------+ +----------+ +----------+ +----------+              |
|  | Total    | | Hebdo    | | Mensuel  | | Ce mois  |              |
|  | 24       | | 12       | | 8        | | 4        |              |
|  +----------+ +----------+ +----------+ +----------+              |
|                                                                   |
|  [Search...] [Type v] [Format v] [Period v]    [List|Grid|Cal]   |
|                                                                   |
|  +--------------------------------------------------------------+|
|  | Title           | Type    | Format | Period    | Actions     ||
|  |-----------------|---------|--------|-----------|-------------||
|  | Rapport Jan 26  | Mensuel | PDF    | Jan 2026  | [Actions]   ||
|  | Rapport Sem 3   | Hebdo   | Word   | 13-19 Jan | [Actions]   ||
|  +--------------------------------------------------------------+|
|                                                                   |
+------------------------------------------------------------------+
```

### A.2 Full-Page Editor Layout

```
+------------------------------------------------------------------+
|  [< Back to Reports]                  [Brouillon] [Publier]       |
+------------------------------------------------------------------+
|          |                                        |               |
| Metadata |            Editor                      | Preview       |
|          |                                        | (toggleable)  |
| [Title]  |  +----------------------------------+ |               |
|          |  | Toolbar: B I U | Table | Insert  | | +----------+  |
| Template |  +----------------------------------+ | |          |  |
| [Select] |  |                                  | | |  Live    |  |
|          |  |                                  | | |  Preview |  |
| Format   |  |      Rich Text Editor            | | |          |  |
| [PDF v]  |  |                                  | | |          |  |
|          |  |                                  | | |          |  |
| Period   |  |                                  | | +----------+  |
| [Jan 26] |  |                                  | |               |
|          |  |                                  | | [Toggle]      |
| [x] AI   |  +----------------------------------+ |               |
|          |                                        |               |
+------------------------------------------------------------------+
```

### A.3 Report Detail Page Layout

```
+------------------------------------------------------------------+
|  [< Reports] / Rapport Janvier 2026                               |
+------------------------------------------------------------------+
|                                                                   |
|  Rapport d'activite - Janvier 2026                                |
|  Cree le 15 Jan 2026 | Mensuel | PDF                              |
|                                                                   |
|  [Modifier] [Exporter v] [Partager] [Supprimer]                   |
|                                                                   |
|  +--------------------------------------------------------------+|
|  |                                                              ||
|  |                    Report Content                            ||
|  |                    (Rich HTML)                               ||
|  |                                                              ||
|  |                                                              ||
|  +--------------------------------------------------------------+|
|                                                                   |
+------------------------------------------------------------------+
```

---

**Document Version**: 1.0 **Last Updated**: 2026-01-22
