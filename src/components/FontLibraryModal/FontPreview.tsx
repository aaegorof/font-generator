import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { GoogleFontFamily } from '../../services/googleFontsApi'
import { parseGoogleFontVariants, FONT_PREVIEW_TEXT } from '../../utils/fonts'
import type { FontDef } from '../../types'

interface FontPreviewProps {
  font: GoogleFontFamily
  isExpanded: boolean
  selectedVariants: Set<string>
  onToggleExpand: () => void
  onToggleVariant: (fontDef: FontDef) => void
}

export function FontPreview({
  font,
  isExpanded,
  selectedVariants,
  onToggleExpand,
  onToggleVariant,
}: FontPreviewProps) {
  const fontDefs = useMemo(
    () => parseGoogleFontVariants(font.family, font.variants),
    [font.family, font.variants],
  )

  const categoryBadgeClass: Record<string, string> = {
    serif: 'bg-secondary text-secondary-foreground',
    'sans-serif': 'bg-accent text-accent-foreground',
    display: 'bg-muted text-foreground',
    handwriting: 'bg-secondary/80 text-secondary-foreground',
    monospace: 'bg-muted text-muted-foreground',
  }

  const badgeClass =
    categoryBadgeClass[font.category] ?? 'bg-muted text-muted-foreground'

  return (
    <div className="border-border border-b">
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-between gap-3 rounded-none px-4 py-3 text-left font-normal hover:bg-muted/50"
        onClick={onToggleExpand}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold">{font.family}</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {font.category}
            </span>
            <span className="text-muted-foreground text-xs">
              {fontDefs.length} variants
            </span>
          </div>
          <div
            className="text-sm"
            style={{
              fontFamily: `'${font.family}', sans-serif`,
              fontWeight: 400,
            }}
          >
            {FONT_PREVIEW_TEXT}
          </div>
        </div>
        <svg
          className={`text-muted-foreground size-5 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isExpanded ? (
        <div className="bg-muted/40 px-4 pb-3">
          <div className="flex flex-col gap-2">
            {fontDefs.map((fontDef) => (
              <Label
                key={fontDef.id}
                className="hover:bg-background flex cursor-pointer items-center gap-3 rounded-md p-2"
              >
                <Checkbox
                  checked={selectedVariants.has(fontDef.id)}
                  onCheckedChange={() => onToggleVariant(fontDef)}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground text-sm font-medium">{fontDef.name}</div>
                  <div
                    className="text-muted-foreground mt-0.5 text-xs"
                    style={{
                      fontFamily: `'${fontDef.family}', sans-serif`,
                      fontWeight: fontDef.weight,
                      fontStyle: fontDef.style || 'normal',
                    }}
                  >
                    {FONT_PREVIEW_TEXT}
                  </div>
                </div>
              </Label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
