# Deferred Work

## Security Enhancements

### File Signature Validation for Font Uploads
**Context:** Font upload only validates file extension, not actual file content.

**Issue:** A malicious user could rename any file (e.g., `.exe`) to `.otf` and pass client-side validation. The Supabase storage bucket accepts `application/octet-stream` which allows any binary file.

**Recommendation:** Implement server-side magic number / file signature validation to verify uploaded files are actually valid font files before storing them.

**Priority:** Medium - Currently mitigated by file extension validation and file size limits, but not a complete defense.

---

## Migration Management

### Existing Migration Modified
**Context:** Story "Fix font upload MIME type error" modified `supabase/migrations/00002_storage_policies.sql` in place.

**Issue:** If this migration has already been applied in production, re-running it may cause issues or be ignored.

**Recommendation:** Establish migration versioning strategy - either:
1. Always create new migration files for changes
2. Use migration tool that tracks checksums/hashes
3. Document which migrations are safe to modify in place

**Priority:** Low - Current change uses `ON CONFLICT DO UPDATE` which is idempotent, but should establish pattern for future.

---

## UX Improvements - Font Naming Convention
**Context:** Task 10.2 - Font Library Data Model implementation.

**Issue:** Generated font names include both the weight name AND numeric weight (e.g., "Roboto Bold 700"), which may be visually redundant.

**Recommendation:** Consider user testing to determine if showing both is helpful or if just the weight name (e.g., "Roboto Bold") or just the number (e.g., "Roboto 700") would be clearer.

**Priority:** Low - Functional but could be more polished after real-world usage feedback.

---

## Future Feature - Variable Font Support
**Context:** Task 10.2 - Font Library Data Model implementation.

**Issue:** Current weight-name mapping only recognizes standard CSS weights (100-900 by 100s). Variable fonts with intermediate weights like 450 or 550 will be misrepresented.

**Recommendation:** Add support for variable fonts and intermediate weights when Epic 10 scope expands beyond static fonts.

**Priority:** Low - Variable fonts are explicitly out of scope for current epic.
