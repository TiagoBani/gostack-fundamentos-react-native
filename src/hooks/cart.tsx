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

  async function getAsyncStorage(): Promise<Product[]> {
    const storageProducts = await AsyncStorage.getItem('GoMarketplace');
    return storageProducts ? JSON.parse(storageProducts) : [];
  }

  async function updateAsyncStorage(parsedProducts: Product[]): Promise<void> {
    await AsyncStorage.setItem('GoMarketplace', JSON.stringify(parsedProducts));
  }

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const parsedProducts = await getAsyncStorage();
      setProducts(parsedProducts);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const storageProduct = { ...product, quantity: 1 };

      const parsedProducts = await getAsyncStorage();

      const storageIndex = parsedProducts.findIndex(
        ({ id: productId }) => product.id === productId,
      );

      if (storageIndex < 0) {
        parsedProducts.push(storageProduct);

        await updateAsyncStorage(parsedProducts);
      }

      const cardProductIndex = products.findIndex(
        productCart => productCart.id === product.id,
      );

      if (cardProductIndex < 0) {
        setProducts([...products, storageProduct]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      products[productIndex].quantity += 1;

      const parsedProducts = await getAsyncStorage();
      const storageIndex = parsedProducts.findIndex(
        ({ id: productId }) => id === productId,
      );
      parsedProducts[storageIndex] = products[productIndex];

      await updateAsyncStorage(parsedProducts);

      setProducts([...products]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const parsedProducts = await getAsyncStorage();
      const storageIndex = parsedProducts.findIndex(
        ({ id: productId }) => id === productId,
      );
      await updateAsyncStorage([]);

      const { quantity } = products[productIndex];
      products[productIndex].quantity = quantity - 1 >= 0 ? quantity - 1 : 0;

      parsedProducts[storageIndex] = products[productIndex];

      const newParsedProducts = parsedProducts.filter(
        item => item.quantity > 0,
      );
      await updateAsyncStorage(newParsedProducts);

      const newProducts = products.filter(item => item.quantity > 0);
      setProducts([...newProducts]);
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
