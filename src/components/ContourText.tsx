import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  layoutNextLineRange,
  materializeLineRange,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import { LIBRARY_DESKTOP_QUERY } from "../hooks/useMediaQuery";

interface ContourTextProps {
  className?: string;
  color?: string;
  paragraphs: string[];
}

interface ContourLine {
  inset: number;
  isSpacer?: boolean;
  text: string;
  width: number;
}

interface ContourParagraph {
  lines: ContourLine[];
}

interface ContourLayout {
  mode: "contour" | "safe-column";
  paragraphs: ContourParagraph[];
}

interface Rectangle {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

interface Point {
  x: number;
  y: number;
}

const FIGURE_GAP = 28;
const FIGURE_VERTICAL_BUFFER = 10;
const MIN_CONTOUR_SAMPLES = 12;
const MAX_CONTOUR_SAMPLES = 48;
const MIN_LINE_WIDTH = 168;
const MAX_LAYOUT_ROWS = 240;

let figureContourCache: {
  geometries: SVGGeometryElement[];
  polygons: Point[][];
  viewportKey: string;
} | null = null;

const getFallbackPolygon = (geometry: SVGGraphicsElement): Point[] => {
  const rectangle = geometry.getBoundingClientRect();
  return [
    { x: rectangle.left, y: rectangle.top },
    { x: rectangle.right, y: rectangle.top },
    { x: rectangle.right, y: rectangle.bottom },
    { x: rectangle.left, y: rectangle.bottom },
  ];
};

const sampleGeometryPolygon = (geometry: SVGGeometryElement): Point[] => {
  const matrix = geometry.getScreenCTM();
  if (!matrix) return getFallbackPolygon(geometry);

  let length = 0;
  try {
    length = geometry.getTotalLength();
  } catch {
    return getFallbackPolygon(geometry);
  }

  if (!Number.isFinite(length) || length <= 0) return getFallbackPolygon(geometry);

  const samples = Math.min(
    MAX_CONTOUR_SAMPLES,
    Math.max(MIN_CONTOUR_SAMPLES, Math.ceil(length / 6)),
  );

  return Array.from({ length: samples }, (_, index) => {
    const point = geometry.getPointAtLength((index / samples) * length);
    const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix);
    return { x: screenPoint.x, y: screenPoint.y };
  });
};

const getFigurePolygons = (): Point[][] => {
  const geometries = Array.from(
    document.querySelectorAll<SVGGeometryElement>(
      "[data-figure] path, [data-figure] circle, [data-figure] ellipse, [data-figure] rect, [data-figure] polygon, [data-figure] polyline",
    ),
  );

  const viewportKey = Array.from(
    document.querySelectorAll<HTMLElement>("[data-layer='female'], [data-layer='male']"),
  ).map((viewport) => {
    const rectangle = viewport.getBoundingClientRect();
    return [rectangle.left, rectangle.top, rectangle.width, rectangle.height]
      .map(Math.round)
      .join(":");
  }).join("|");

  if (
    figureContourCache &&
    figureContourCache.viewportKey === viewportKey &&
    figureContourCache.geometries.length === geometries.length &&
    figureContourCache.geometries.every((geometry, index) => geometry === geometries[index])
  ) {
    return figureContourCache.polygons;
  }

  const polygons = geometries
    .filter((geometry) => {
      const style = window.getComputedStyle(geometry);
      return style.display !== "none" && style.visibility !== "hidden";
    })
    .map(sampleGeometryPolygon)
    .filter((polygon) => polygon.length >= 3);

  figureContourCache = { geometries, polygons, viewportKey };
  return polygons;
};

const getPolygonXsAtY = (points: Point[], y: number): number[] => {
  const xs: number[] = [];
  let start = points[points.length - 1];

  for (const end of points) {
    const crossesY =
      (start.y <= y && y < end.y) ||
      (end.y <= y && y < start.y);

    if (crossesY) {
      xs.push(start.x + ((y - start.y) * (end.x - start.x)) / (end.y - start.y));
    }

    start = end;
  }

  return xs.sort((a, b) => a - b);
};

const getPolygonRightForBand = (
  points: Point[],
  bandTop: number,
  bandBottom: number,
): number | null => {
  const startY = Math.floor(bandTop - FIGURE_VERTICAL_BUFFER);
  const endY = Math.ceil(bandBottom + FIGURE_VERTICAL_BUFFER);
  let right = Number.NEGATIVE_INFINITY;

  for (let y = startY; y <= endY; y += 1) {
    const xs = getPolygonXsAtY(points, y + 0.5);
    if (xs.length > 0) right = Math.max(right, xs[xs.length - 1]);
  }

  return Number.isFinite(right) ? right : null;
};

const getFigureBounds = (polygons: Point[][]): Rectangle[] => (
  polygons.map((points) => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    return {
      bottom: Math.max(...ys),
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
    };
  })
);

const createCanvasFont = (style: CSSStyleDeclaration) => (
  `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
);

const ContourText: React.FC<ContourTextProps> = ({ className = "", color, paragraphs }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);
  const preparedCacheRef = useRef(new Map<string, PreparedTextWithSegments>());
  const [layout, setLayout] = useState<ContourLayout | null>(null);
  const paragraphKey = paragraphs.join("\u0000");

  const calculateLayout = useCallback(() => {
    frameRef.current = null;
    const root = rootRef.current;
    const probe = probeRef.current;

    if (!root || !probe || !window.matchMedia(LIBRARY_DESKTOP_QUERY).matches) {
      setLayout(null);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    if (rootRect.width <= 0) return;

    const computed = window.getComputedStyle(probe);
    const fontSize = Number.parseFloat(computed.fontSize) || 20;
    const parsedLineHeight = Number.parseFloat(computed.lineHeight);
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.625;
    const letterSpacing = Number.parseFloat(computed.letterSpacing);
    const paragraphGap = 24;
    const figurePolygons = getFigurePolygons();
    const figureBounds = getFigureBounds(figurePolygons);
    const canvasFont = createCanvasFont(computed);
    const normalizedLetterSpacing = Number.isFinite(letterSpacing) ? letterSpacing : 0;

    const getPreparedParagraph = (paragraph: string) => {
      const cacheKey = `${canvasFont}\u0000${normalizedLetterSpacing}\u0000${paragraph}`;
      let prepared = preparedCacheRef.current.get(cacheKey);
      if (!prepared) {
        prepared = prepareWithSegments(paragraph, canvasFont, {
          letterSpacing: normalizedLetterSpacing,
        });
        preparedCacheRef.current.set(cacheKey, prepared);
      }
      return prepared;
    };

    const buildLayout = (resolveInset: (lineTop: number, lineBottom: number) => number) => {
      let y = 0;
      const laidOutParagraphs = paragraphs.map((paragraph) => {
        const prepared = getPreparedParagraph(paragraph);
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
        const lines: ContourLine[] = [];
        let rowCount = 0;

        while (rowCount < MAX_LAYOUT_ROWS) {
          const lineTop = rootRect.top + y;
          const lineBottom = lineTop + lineHeight;
          const requestedInset = Math.round(resolveInset(lineTop, lineBottom));
          const availableWidth = rootRect.width - requestedInset;

          if (availableWidth < MIN_LINE_WIDTH) {
            lines.push({ inset: 0, isSpacer: true, text: "", width: rootRect.width });
            y += lineHeight;
            rowCount += 1;
            continue;
          }

          const range = layoutNextLineRange(prepared, cursor, availableWidth);
          if (range === null) break;

          const line = materializeLineRange(prepared, range);
          lines.push({ inset: requestedInset, text: line.text, width: availableWidth });
          cursor = range.end;
          y += lineHeight;
          rowCount += 1;
        }

        y += paragraphGap;
        return { lines };
      });

      return {
        height: Math.max(0, y - (paragraphs.length > 0 ? paragraphGap : 0)),
        paragraphs: laidOutParagraphs,
      };
    };

    const contourLayout = buildLayout((lineTop, lineBottom) => {
      const obstructionRight = figurePolygons.reduce((furthestRight, polygon, index) => {
        const bounds = figureBounds[index];
        const crossesPanel = bounds.right > rootRect.left && bounds.left < rootRect.right;
        if (!crossesPanel) return furthestRight;

        const polygonRight = getPolygonRightForBand(polygon, lineTop, lineBottom);
        return polygonRight === null ? furthestRight : Math.max(furthestRight, polygonRight);
      }, rootRect.left - FIGURE_GAP);

      return Math.max(0, obstructionRight + FIGURE_GAP - rootRect.left);
    });

    const scrollArea = root.closest<HTMLElement>("[data-game-info-scroll]");
    const scrollRect = scrollArea?.getBoundingClientRect();
    const visibleBodyHeight = scrollRect ? Math.max(lineHeight, scrollRect.bottom - rootRect.top) : Number.POSITIVE_INFINITY;
    const requiresScrolling = contourLayout.height > visibleBodyHeight + lineHeight;

    if (!requiresScrolling) {
      setLayout({ mode: "contour", paragraphs: contourLayout.paragraphs });
      return;
    }

    const safeRightEdge = figureBounds.reduce((furthestRight, rectangle) => {
      const crossesPanel = rectangle.right > rootRect.left && rectangle.left < rootRect.right;
      return crossesPanel ? Math.max(furthestRight, rectangle.right) : furthestRight;
    }, rootRect.left - FIGURE_GAP);
    const safeInset = Math.min(
      Math.max(0, safeRightEdge + FIGURE_GAP - rootRect.left),
      Math.max(0, rootRect.width - MIN_LINE_WIDTH),
    );
    const safeLayout = buildLayout(() => safeInset);
    setLayout({ mode: "safe-column", paragraphs: safeLayout.paragraphs });
  }, [paragraphKey, paragraphs]);

  const scheduleLayout = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(calculateLayout);
  }, [calculateLayout]);

  useLayoutEffect(() => {
    let cancelled = false;
    calculateLayout();

    const panel = rootRef.current?.closest<HTMLElement>("[data-game-info-panel]");
    const figureViewports = Array.from(
      document.querySelectorAll<HTMLElement>("[data-layer='female'], [data-layer='male']"),
    );
    const observer = new ResizeObserver(scheduleLayout);

    if (panel) observer.observe(panel);
    figureViewports.forEach((viewport) => observer.observe(viewport));
    window.addEventListener("resize", scheduleLayout, { passive: true });
    document.addEventListener("frankcards:figure-layout", scheduleLayout);
    void document.fonts?.ready.then(() => {
      if (!cancelled) scheduleLayout();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", scheduleLayout);
      document.removeEventListener("frankcards:figure-layout", scheduleLayout);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [calculateLayout, scheduleLayout]);

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 max-w-full ${className}`}
      data-contour-mode={layout?.mode ?? "fallback"}
      style={color ? { color } : undefined}
    >
      <span ref={probeRef} aria-hidden="true" className="pointer-events-none absolute invisible">M</span>

      {layout ? (
        <>
          <div className="sr-only">
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          <div aria-hidden="true">
            {layout.paragraphs.map((paragraph, paragraphIndex) => (
              <motion.div
                key={paragraphIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + paragraphIndex * 0.1 }}
                className="mb-6 last:mb-0"
              >
                {paragraph.lines.map((line, lineIndex) => (
                  <span
                    key={lineIndex}
                    className="block whitespace-pre text-right"
                    style={{
                      height: "1.625em",
                      lineHeight: "1.625em",
                      marginLeft: line.inset,
                      visibility: line.isSpacer ? "hidden" : "visible",
                      width: line.width,
                    }}
                  >
                    {line.text || "\u00a0"}
                  </span>
                ))}
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        paragraphs.map((paragraph, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="mb-4 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] sm:mb-6 lg:ml-auto lg:max-w-[44ch]"
          >
            {paragraph}
          </motion.p>
        ))
      )}
    </div>
  );
};

export default ContourText;
