import { forwardRef, type ReactNode } from "react";
import type { LucideProps } from "lucide-react";

/**
 * Pragya Pravah custom hero icons (Phase 2A exploration).
 *
 * Lucide-compatible: same prop surface (`size`, `strokeWidth`,
 * `absoluteStrokeWidth`, `color`, className, …) and the same
 * `ForwardRefExoticComponent` shape, so each is assignable to `LucideIcon`
 * and works inside <AppIcon icon={…} tone="…" />. They use `currentColor`
 * only, so they inherit the `text-icon-*` tokens. Default strokeWidth 1.75
 * matches AppIcon. ViewBox 0 0 24 24, round caps/joins.
 *
 * NOT wired into production yet — review-only.
 */

export type HeritageIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

function createHeritageIcon(iconName: string, children: ReactNode): HeritageIcon {
  const Component = forwardRef<SVGSVGElement, LucideProps>(
    (
      {
        size = 24,
        strokeWidth = 1.75,
        absoluteStrokeWidth,
        color = "currentColor",
        className,
        ...rest
      },
      ref,
    ) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={
          absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
      >
        {children}
      </svg>
    ),
  );
  Component.displayName = iconName;
  return Component;
}

/**
 * FlameBell — notification/attention + steady wisdom flame.
 * One silhouette reads as both a flame (pointed top) and a bell (flared mouth),
 * with an inner ember curl and a clapper arc.
 */
export const FlameBell = createHeritageIcon(
  "FlameBell",
  <>
    <path d="M12 2.5C9 7 7.5 9.5 7.5 13c0 2.2.5 4 1.5 5.5h6c1-1.5 1.5-3.3 1.5-5.5C16.5 9.5 15 7 12 2.5Z" />
    <path d="M12 9.8c-.9 1.1-.9 2.4 0 3.4" />
    <path d="M10.5 21a1.5 1.5 0 0 0 3 0" />
  </>,
);

/**
 * GranthNib — articles / aalekh / knowledge creation.
 * Open granth (two gull-wing pages) with a single, enlarged pen nib descending
 * into the spine. Slit removed for 16px legibility (Phase 2B).
 */
export const GranthNib = createHeritageIcon(
  "GranthNib",
  <>
    <path d="M12 8C10.3 6.9 8 6.5 4.5 7v10c3.5-.5 5.8-.1 7.5 1" />
    <path d="M12 8c1.7-1.1 4-1.5 7.5-1v10c-3.5-.5-5.8-.1-7.5 1" />
    <path d="M12 8 10.2 4.3 12 2l1.8 2.3Z" />
  </>,
);

/**
 * VimarshCircles — dialogue / discussion / poll (विचार-विमर्श).
 * Two facing arcs deliberating around a central bindu.
 */
export const VimarshCircles = createHeritageIcon(
  "VimarshCircles",
  <>
    <path d="M10 6.5A6 6 0 0 0 10 17.5" />
    <path d="M14 6.5A6 6 0 0 1 14 17.5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </>,
);

/**
 * BinduNetwork — organisation identity / knowledge-flow / structured network.
 * Four nodes in an asymmetric (leaning) cycle: every node has exactly two
 * links, so it can never read as a hub-fan, three-prong, or figure. The bindu
 * (filled, lower-left) is the origin of the flow; the top and bottom edges are
 * gentle flow curves, the left and right edges are explicit straight links.
 * Redesigned in Phase 2B.
 */
export const BinduNetwork = createHeritageIcon(
  "BinduNetwork",
  <>
    <circle cx="9" cy="18.5" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="8" r="1.35" />
    <circle cx="15" cy="5.5" r="1.35" />
    <circle cx="19.5" cy="16" r="1.35" />
    <path d="M5.8 7.7C8.5 6.3 11 5.8 13.7 5.7" />
    <path d="M15.9 6.8 18.9 14.9" />
    <path d="M18.3 16.7C15.5 18.4 12.5 18.7 10.3 18.5" />
    <path d="M8.4 17.2 5.1 9.3" />
  </>,
);
