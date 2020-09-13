import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProductsKeys = await AsyncStorage.getAllKeys();
      const storageProducts = await AsyncStorage.multiGet(storageProductsKeys);

      const parsedProducts = storageProducts
        .map(item => {
          return item[1] ? JSON.parse(item[1]) : null;
        })
        .filter(item => !!item);

      setProducts(parsedProducts);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const cardProductIndex = products.findIndex(
        productCart => productCart.id === product.id,
      );
      if (cardProductIndex < 0) {
        const storageProduct = { ...product, quantity: 1 };
        await AsyncStorage.setItem(product.id, JSON.stringify(storageProduct));
        setProducts([...products, storageProduct]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      products[productIndex].quantity += 1;

      setProducts([...products]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (products[productIndex].quantity - 1 <= 0) {
        const newProducts = products.filter(
          ({ id: productId }) => productId !== id,
        );

        // await AsyncStorage.removeItem(id);
        setProducts([...newProducts]);
      } else {
        products[productIndex].quantity -= 1;
        setProducts([...products]);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
