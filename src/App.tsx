import React from "react";
import ProductCarousel from "./components/product-carousel";

// Define the Product type for our mock data.
interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
}

// Create a mock array of products using Picsum images.
const products: Product[] = [
  {
    id: 1,
    name: "Product One",
    description: "This is product one",
    image: "https://picsum.photos/seed/1/250/300", // Random image from Picsum
  },
  {
    id: 2,
    name: "Product Two",
    description: "This is product two",
    image: "https://picsum.photos/seed/2/250/300",
  },
  {
    id: 3,
    name: "Product Three",
    description: "This is product three",
    image: "https://picsum.photos/seed/3/250/300",
  },
  {
    id: 4,
    name: "Product Four",
    description: "This is product four",
    image: "https://picsum.photos/seed/4/250/300",
  },
  {
    id: 5,
    name: "Product Four",
    description: "This is product four",
    image: "https://picsum.photos/seed/5/250/300",
  },
  {
    id: 6,
    name: "Product Four",
    description: "This is product four",
    image: "https://picsum.photos/seed/6/250/300",
  },
  {
    id: 7,
    name: "Product Four",
    description: "This is product four",
    image: "https://picsum.photos/seed/7/250/300",
  },
  {
    id: 8,
    name: "Product Four",
    description: "This is product four",
    image: "https://picsum.photos/seed/8/250/300",
  },
];

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-6 text-center">Our Beautiful Product Carousel</h1>
      {/* Wrap the carousel in a container to prevent horizontal overflow */}
      <div className="w-full max-w-4xl overflow-hidden">
        <ProductCarousel
          cellAlign="center"
          centerOnArrowClick={false}
          groupCells={1}
          adaptiveHeight={true}
          allowDrag={true}
          onSelect={(index, cell) => console.log("Selected cell index:", index, cell)}
        >
          {products.map((product) => (
            <div key={product.id} className="flex flex-col items-center select-none">
              {/* Display the product image from Picsum */}
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover no-select"
                loading="lazy"
              />
              <div className="p-4 text-center">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            </div>
          ))}
        </ProductCarousel>
      </div>
    </div>
  );
};

export default App;
