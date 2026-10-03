import { SheetContent, useSheetKind } from './SheetContent';

export function BottomSheet() {
  const kind = useSheetKind();
  if (!kind) return null;
  return (
    <section className="sheet">
      <SheetContent />
    </section>
  );
}
