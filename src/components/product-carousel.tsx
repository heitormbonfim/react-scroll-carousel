import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useRef, ReactNode, MouseEvent } from "react";

interface ProductCarouselProps {
  children: ReactNode;
  allowDrag?: boolean;
  oneAtATime?: boolean; // When true, only one product is visible at a time.
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ children, allowDrag = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const touchStartRef = useRef({ x: 0, scrollLeft: 0 });

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

  // Scrolls 90% of the container width forward.
  const handleNext = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth * 0.9;
    containerRef.current.scrollTo({
      left: containerRef.current.scrollLeft + width,
      behavior: "smooth",
    });
  };

  // Scrolls 90% of the container width backward.
  const handlePrevious = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth * 0.9;
    containerRef.current.scrollTo({
      left: containerRef.current.scrollLeft - width,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className="w-full overflow-x-auto no-scrollbar flex gap-4 p-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {React.Children.map(children, (child) => (
          <div className="flex-shrink-0 w-64 min-h-[300px] scroll-snap-center bg-white rounded-lg shadow-lg overflow-hidden">
            {child}
          </div>
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
