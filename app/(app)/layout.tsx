import { TabBar } from "@/components/ui/TabBar";

/**
 * The tabbed shell. The lock screen sits outside this group, which is why the
 * tab bar can be unconditional here rather than hidden by a path check that
 * would differ between server and client render.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Clears the fixed tab bar plus the home indicator beneath it. */}
      <div className="flex flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
        {children}
      </div>
      <TabBar />
    </>
  );
}
