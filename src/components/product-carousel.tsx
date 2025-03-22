import React, { useRef, useState, useEffect, useCallback, ReactNode, MouseEvent } from "react";

// Define the props for our ProductCarousel component.
interface ProductCarouselProps {
  children: ReactNode; // The product cards to display.
  // Determines how a cell is aligned inside the viewport.
  cellAlign?: "start" | "center" | "end";
  groupCells?: number; // How many cells to scroll at once (default is 1).
  adaptiveHeight?: boolean; // If true, the container's height adapts to the current cell.
  allowDrag?: boolean; // Enable drag-to-scroll functionality.
  onSelect?: (index: number, cell: HTMLElement | null) => void; // Callback when a cell is selected.
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  children,
  cellAlign = "center",
  groupCells = 1,
  adaptiveHeight = false,
  allowDrag = true,
  onSelect,
}) => {
  // Reference to the carousel container.
  const containerRef = useRef<HTMLDivElement>(null);
  // State to track the currently selected (centered) cell index.
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // Ref to track whether dragging is active.
  const isDraggingRef = useRef<boolean>(false);
  // Ref to store the initial positions when dragging starts.
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  // Ref to store a timeout ID for debouncing scroll events.
  const scrollTimeoutRef = useRef<number | null>(null);

  // Helper: Retrieve all direct children of the container as HTMLElements.
  const getCells = (): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.children) as HTMLElement[];
  };

  // Calculate the left scroll offset needed to properly align a cell
  // based on the chosen alignment (start, center, end).
  const calculateLeftScroll = (cell: HTMLElement): number => {
    const container = containerRef.current;
    if (!container) return 0;
    let scrollLeft: number = 0;
    if (cellAlign === "start") {
      scrollLeft = cell.offsetLeft;
    } else if (cellAlign === "center") {
      scrollLeft = Math.round(cell.offsetLeft - container.clientWidth / 2 + cell.clientWidth / 2);
    } else if (cellAlign === "end") {
      scrollLeft = cell.offsetLeft + cell.clientWidth - container.clientWidth;
    }
    // Ensure we don't scroll out of bounds.
    return Math.min(Math.max(scrollLeft, 0), container.scrollWidth - container.clientWidth);
  };

  // Determine which cell is closest to the current scroll position.
  // This function is used to auto-snap to the nearest cell when scrolling stops.
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

  // Update the selected index and trigger the onSelect callback if provided.
  const updateSelectedIndex = (index: number) => {
    setSelectedIndex(index);
    if (onSelect) {
      const cells = getCells();
      onSelect(index, cells[index] || null);
    }
  };

  // Scroll event handler: uses a timeout to detect when scrolling stops,
  // then snaps to the nearest cell.
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      updateSelectedIndex(calculateClosestIndex());
    }, 75);
  }, [cellAlign]);

  // Mouse down event: start tracking drag.
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
      // Temporarily disable snap while dragging.
      containerRef.current.style.scrollSnapType = "none";
    }
  };

  // Mouse move event: update the scroll position as the user drags.
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const dx = e.pageX - dragStartRef.current.x;
    containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
  };

  // Mouse up or leave event: end dragging and snap to the nearest cell.
  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!allowDrag || !containerRef.current) return;
    isDraggingRef.current = false;
    // Re-enable snapping.
    containerRef.current.style.scrollSnapType = "";
    // If dragging occurred, smooth-scroll to the nearest cell.
    if (Math.abs(e.pageX - dragStartRef.current.x) > 0) {
      const cells = getCells();
      const cell = cells[selectedIndex];
      if (cell) {
        containerRef.current.scrollTo({
          left: calculateLeftScroll(cell),
          behavior: "smooth",
        });
      }
    }
  };

  // Handler for the left arrow: moves to the previous cell.
  const handlePrevious = () => {
    const cells = getCells();
    const newIndex = Math.max(selectedIndex - groupCells, 0);
    updateSelectedIndex(newIndex);
    if (containerRef.current && cells[newIndex]) {
      containerRef.current.scrollTo({
        left: calculateLeftScroll(cells[newIndex]),
        behavior: "smooth",
      });
    }
  };

  // Handler for the right arrow: moves to the next cell.
  const handleNext = () => {
    const cells = getCells();
    const newIndex = Math.min(selectedIndex + groupCells, cells.length - 1);
    updateSelectedIndex(newIndex);
    if (containerRef.current && cells[newIndex]) {
      containerRef.current.scrollTo({
        left: calculateLeftScroll(cells[newIndex]),
        behavior: "smooth",
      });
    }
  };

  // If adaptiveHeight is enabled, adjust the container's max height to the current cell.
  useEffect(() => {
    if (adaptiveHeight && containerRef.current) {
      const cells = getCells();
      const cell = cells[selectedIndex];
      if (cell) {
        containerRef.current.style.maxHeight = `${cell.clientHeight}px`;
      }
    }
  }, [adaptiveHeight, selectedIndex]);

  // Attach the scroll event listener when the component mounts.
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return (
    // The outer relative container prevents the carousel from overflowing the page.
    <div className="relative w-full max-w-4xl overflow-hidden">
      {/* 
        Carousel container styled with Tailwind.
        - "overflow-x-auto" enables horizontal scrolling.
        - "no-scrollbar" (defined globally) hides the scrollbar.
        - "flex gap-4 p-4" arranges the cells in a row with spacing.
      */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto no-scrollbar flex gap-4 p-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {React.Children.map(children, (child) => (
          // Each cell is a fixed-width, non-shrinking div with snapping enabled.
          <div className="flex-shrink-0 w-64 min-h-[300px] scroll-snap-center bg-white rounded-lg shadow-lg overflow-hidden">
            {child}
          </div>
        ))}
      </div>

      {/* Left arrow button: positioned absolutely on the left center. */}
      <button
        onClick={handlePrevious}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-10"
      >
        <span className="text-xl font-bold">&lsaquo;</span>
      </button>

      {/* Right arrow button: positioned absolutely on the right center. */}
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-10"
      >
        <span className="text-xl font-bold">&rsaquo;</span>
      </button>
    </div>
  );
};

export default ProductCarousel;
