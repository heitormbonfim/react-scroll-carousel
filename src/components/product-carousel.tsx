import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useRef, useState, useEffect, ReactNode, MouseEvent } from "react";

interface ProductCarouselProps {
  children: ReactNode;
  cellAlign?: "start" | "center" | "end";
  groupCells?: number;
  adaptiveHeight?: boolean;
  allowDrag?: boolean;
  onSelect?: (index: number, cell: HTMLElement | null) => void;
  centerOnArrowClick?: boolean; // When true, arrow clicks center the cell.
  oneAtATime?: boolean; // When true, only one product is visible at a time.
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  children,
  cellAlign = "center",
  groupCells = 1,
  adaptiveHeight = false,
  allowDrag = true,
  onSelect,
  centerOnArrowClick = true,
  oneAtATime = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const touchStartRef = useRef({ x: 0, scrollLeft: 0 });

  // Helper: Get all carousel cells.
  const getCells = (): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.children) as HTMLElement[];
  };

  // Calculate the scrollLeft needed to align a given cell.
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

  // Update the selected index and trigger onSelect.
  const updateSelectedIndex = (index: number) => {
    setSelectedIndex(index);
    if (onSelect) {
      const cells = getCells();
      onSelect(index, cells[index] || null);
    }
  };

  // Mouse down: start tracking drag.
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!allowDrag) return;
    isDraggingRef.current = true;
    if (containerRef.current) {
      dragStartRef.current = {
        x: e.pageX,
        scrollLeft: containerRef.current.scrollLeft,
      };
    }
  };

  // Mouse move: update scroll based on movement.
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const dx = e.pageX - dragStartRef.current.x;
    containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
  };

  // Mouse up: simply end dragging.
  const handleMouseUp = () => {
    if (!allowDrag) return;
    isDraggingRef.current = false;
  };

  // Touch events for mobile.
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!allowDrag) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      scrollLeft: containerRef.current?.scrollLeft || 0,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    containerRef.current.scrollLeft = touchStartRef.current.scrollLeft - dx;
  };

  // No auto-snapping on touch end.
  const handleTouchEnd = () => {
    // Dragging stops wherever the user leaves it.
  };

  // If adaptiveHeight is enabled, adjust container height to match the current cell.
  useEffect(() => {
    if (adaptiveHeight && containerRef.current) {
      const cells = getCells();
      const cell = cells[selectedIndex];
      if (cell) {
        containerRef.current.style.maxHeight = `${cell.clientHeight}px`;
      }
    }
  }, [adaptiveHeight, selectedIndex]);

  // Arrow click: center the corresponding cell if enabled.
  const handlePrevious = () => {
    const cells = getCells();
    let newIndex: number;
    if (centerOnArrowClick) {
      newIndex = Math.max(selectedIndex - groupCells, 0);
      updateSelectedIndex(newIndex);
      if (containerRef.current && cells[newIndex]) {
        containerRef.current.scrollTo({
          left: calculateLeftScroll(cells[newIndex]),
          behavior: "smooth",
        });
      }
    } else if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -containerRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleNext = () => {
    const cells = getCells();
    let newIndex: number;
    if (centerOnArrowClick) {
      newIndex = Math.min(selectedIndex + groupCells, cells.length - 1);
      updateSelectedIndex(newIndex);
      if (containerRef.current && cells[newIndex]) {
        containerRef.current.scrollTo({
          left: calculateLeftScroll(cells[newIndex]),
          behavior: "smooth",
        });
      }
    } else if (containerRef.current) {
      containerRef.current.scrollBy({
        left: containerRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  // Determine container and cell classes.
  const containerClasses = oneAtATime
    ? "w-64 overflow-hidden"
    : "w-full overflow-x-auto no-scrollbar";
  const cellClasses = oneAtATime
    ? "flex-shrink-0 w-full min-h-[300px] scroll-snap-center bg-white rounded-lg shadow-lg overflow-hidden"
    : "flex-shrink-0 w-64 min-h-[300px] scroll-snap-center bg-white rounded-lg shadow-lg overflow-hidden";

  return (
    <div className="relative w-full max-w-4xl overflow-hidden">
      <div
        ref={containerRef}
        className={`${containerClasses} flex gap-4 p-4`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {React.Children.map(children, (child) => (
          <div className={cellClasses}>{child}</div>
        ))}
      </div>

      <button
        onClick={handlePrevious}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm text-white rounded-full p-3 shadow-lg z-10"
      >
        <ArrowLeft />
      </button>

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
