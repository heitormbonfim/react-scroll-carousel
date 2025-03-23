import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useRef, useState, useEffect, useCallback, ReactNode, MouseEvent } from "react";
// Define props for the ProductCarousel component.

interface ProductCarouselProps {
  children: ReactNode; // Carousel items (e.g. product cards)
  cellAlign?: "start" | "center" | "end"; // How cells are aligned when snapping (for arrow clicks when centerOnArrowClick is true)
  groupCells?: number; // How many cells to scroll at once (used with centerOnArrowClick behavior)
  adaptiveHeight?: boolean; // If true, adjusts container height to match the current cell
  allowDrag?: boolean; // Enables drag-to-scroll functionality
  onSelect?: (index: number, cell: HTMLElement | null) => void; // Callback when cell selection changes

  // New boolean options:
  centerOnArrowClick?: boolean; // If true (default), arrow click centers the card. If false, it scrolls by container width.
  freeDrag?: boolean; // If true, dragging stops exactly where the user releases (no auto-snap)
  oneAtATime?: boolean; // If true, only one product is visible at a time; container width equals product width.
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  children,
  cellAlign = "center",
  groupCells = 1,
  adaptiveHeight = false,
  allowDrag = true,
  onSelect,
  centerOnArrowClick = true,
  freeDrag = false,
  oneAtATime = false,
}) => {
  // Reference to the carousel container.
  const containerRef = useRef<HTMLDivElement>(null);
  // Track the currently selected cell index.
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // Track whether the carousel is currently being dragged.
  const isDraggingRef = useRef<boolean>(false);
  // Store the initial mouse and scroll positions when dragging starts.
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  // For debouncing the scroll event.
  const scrollTimeoutRef = useRef<number | null>(null);

  // Helper: Get all the carousel cells (children elements).
  const getCells = (): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.children) as HTMLElement[];
  };

  // Calculate the scrollLeft needed to align a given cell.
  // Used when centerOnArrowClick is true.
  const calculateLeftScroll = (cell: HTMLElement): number => {
    const container = containerRef.current;
    if (!container) return 0;
    let scrollLeft = 0;
    if (cellAlign === "start") {
      scrollLeft = cell.offsetLeft;
    } else if (cellAlign === "center") {
      scrollLeft = Math.round(cell.offsetLeft - container.clientWidth / 2 + cell.clientWidth / 2);
    } else if (cellAlign === "end") {
      scrollLeft = cell.offsetLeft + cell.clientWidth - container.clientWidth;
    }
    return Math.min(Math.max(scrollLeft, 0), container.scrollWidth - container.clientWidth);
  };

  // Determine the closest cell index to the current scroll position.
  // This is used to update the selectedIndex when auto-snapping.
  const calculateClosestIndex = (): number => {
    const cells = getCells();
    const container = containerRef.current;
    if (!container || cells.length === 0) return 0;
    let targetPoint = 0;
    let closestIndex = 0;
    let minDiff = Infinity;
    if (cellAlign === "center") {
      targetPoint = container.scrollLeft + container.clientWidth / 2;
      cells.forEach((cell, index) => {
        const cellCenter = cell.offsetLeft + cell.clientWidth / 2;
        const diff = Math.abs(cellCenter - targetPoint);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });
    } else if (cellAlign === "start") {
      targetPoint = container.scrollLeft;
      cells.forEach((cell, index) => {
        const diff = Math.abs(cell.offsetLeft - targetPoint);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });
    } else if (cellAlign === "end") {
      targetPoint = container.scrollLeft + container.clientWidth;
      cells.forEach((cell, index) => {
        const diff = Math.abs(cell.offsetLeft + cell.clientWidth - targetPoint);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });
    }
    return closestIndex;
  };

  // Update the selected index and trigger the onSelect callback.
  const updateSelectedIndex = (index: number) => {
    setSelectedIndex(index);
    if (onSelect) {
      const cells = getCells();
      onSelect(index, cells[index] || null);
    }
  };

  // Scroll event handler: debounce and then update the selected index.
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      // If freeDrag is false, auto-snap to the nearest cell.
      if (!freeDrag) {
        updateSelectedIndex(calculateClosestIndex());
      }
    }, 75);
  }, [cellAlign, freeDrag]);

  // Mouse down: start tracking drag.
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!allowDrag) return;
    isDraggingRef.current = true;
    if (containerRef.current) {
      dragStartRef.current = {
        x: e.pageX,
        y: e.pageY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      };
      // Disable snapping while dragging.
      containerRef.current.style.scrollSnapType = "none";
    }
  };

  // Mouse move: update scroll based on mouse movement.
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const dx = e.pageX - dragStartRef.current.x;
    containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
  };

  // Mouse up: stop dragging.
  // If freeDrag is false, auto-snap; otherwise, leave the carousel where it is.
  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!allowDrag || !containerRef.current) return;
    isDraggingRef.current = false;
    containerRef.current.style.scrollSnapType = "";
    if (!freeDrag && Math.abs(e.pageX - dragStartRef.current.x) > 0) {
      const cells = getCells();
      const closestIndex = calculateClosestIndex();
      const cell = cells[closestIndex];
      if (cell) {
        containerRef.current.scrollTo({
          left: calculateLeftScroll(cell),
          behavior: "smooth",
        });
      }
      updateSelectedIndex(closestIndex);
    }
  };

  // Global mouseup handler ensures dragging stops even if mouse leaves the container.
  // Global mouseup handler ensures dragging stops even if mouse is released outside the container.
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (isDraggingRef.current && containerRef.current) {
        isDraggingRef.current = false;
        containerRef.current.style.scrollSnapType = "";
        if (!freeDrag) {
          const cells = getCells();
          const closestIndex = calculateClosestIndex();
          const cell = cells[closestIndex];
          if (cell) {
            containerRef.current.scrollTo({
              left: calculateLeftScroll(cell),
              behavior: "smooth",
            });
          }
          updateSelectedIndex(closestIndex);
        }
      }
    };
    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [freeDrag]);

  // Adjust container height to match the current cell if adaptiveHeight is enabled.
  useEffect(() => {
    if (adaptiveHeight && containerRef.current) {
      const cells = getCells();
      const cell = cells[selectedIndex];
      if (cell) {
        containerRef.current.style.maxHeight = `${cell.clientHeight}px`;
      }
    }
  }, [adaptiveHeight, selectedIndex]);

  // Attach the scroll event listener.
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // Handler for left arrow click.
  const handlePrevious = () => {
    const cells = getCells();
    let newIndex: number;
    if (centerOnArrowClick) {
      // Move back by groupCells and center the target cell.
      newIndex = Math.max(selectedIndex - groupCells, 0);
      updateSelectedIndex(newIndex);
      if (containerRef.current && cells[newIndex]) {
        containerRef.current.scrollTo({
          left: calculateLeftScroll(cells[newIndex]),
          behavior: "smooth",
        });
      }
    } else {
      // Scroll left by the container width (100%).
      if (containerRef.current) {
        containerRef.current.scrollBy({
          left: -containerRef.current.clientWidth,
          behavior: "smooth",
        });
        // Let the scroll event update selectedIndex based on nearest cell.
      }
    }
  };

  // Handler for right arrow click.
  const handleNext = () => {
    const cells = getCells();
    let newIndex: number;
    if (centerOnArrowClick) {
      // Move forward by groupCells and center the target cell.
      newIndex = Math.min(selectedIndex + groupCells, cells.length - 1);
      updateSelectedIndex(newIndex);
      if (containerRef.current && cells[newIndex]) {
        containerRef.current.scrollTo({
          left: calculateLeftScroll(cells[newIndex]),
          behavior: "smooth",
        });
      }
    } else {
      // Scroll right by the container width (100%).
      if (containerRef.current) {
        containerRef.current.scrollBy({
          left: containerRef.current.clientWidth,
          behavior: "smooth",
        });
      }
    }
  };

  // Determine container and cell class names based on oneAtATime option.
  // If oneAtATime is true, the container width is fixed to the product width (here 250px).
  const containerClasses = oneAtATime
    ? "w-64 overflow-hidden" // Fixed width matching product cell
    : "w-full overflow-x-auto no-scrollbar";
  const cellClasses = oneAtATime
    ? "flex-shrink-0 w-full min-h-[300px] scroll-snap-center bg-white rounded-lg shadow-lg overflow-hidden"
    : "flex-shrink-0 w-64 min-h-[300px] scroll-snap-center bg-white rounded-lg shadow-lg overflow-hidden";

  return (
    // Outer relative container to confine carousel and position arrows.
    <div className="relative w-full max-w-4xl overflow-hidden">
      <div
        ref={containerRef}
        className={`${containerClasses} flex gap-4 p-4`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {React.Children.map(children, (child) => (
          <div className={cellClasses}>{child}</div>
        ))}
      </div>

      {/* Left arrow button */}
      <button
        onClick={handlePrevious}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm text-white rounded-full p-3 shadow-lg z-10"
      >
        <ArrowLeft />
      </button>

      {/* Right arrow button */}
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm text-white rounded-full p-3 shadow-lg z-10"
      >
        <ArrowRight />
      </button>
    </div>
  );
};

export default ProductCarousel;
