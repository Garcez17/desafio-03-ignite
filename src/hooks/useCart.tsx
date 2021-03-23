import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProductInCart = cart.find(product => product.id === productId);

      if (!findProductInCart) {
        const productResponse = await api.get(`products/${productId}`);

        const newCart = [
          ...cart, 
          { ...productResponse.data, amount: 1 }
        ];

        setCart(newCart);
        
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        updateProductAmount({ productId, amount: findProductInCart.amount + 1 });
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const filteredProducts = cart.filter(product => product.id !== productId);
      const findProductInCart = cart.find(product => product.id === productId);

      if (!findProductInCart) {
        throw new Error();
      }

      setCart(filteredProducts);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProducts));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const findProductInCart = cart.find(product => product.id === productId);
      const stockResponse = await api.get<Stock>(`stock/${productId}`);

      if (!findProductInCart) {
        return;
      }

      if (amount < 1) {
        throw new Error();
      }

      if (amount > stockResponse.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(product => product.id === productId ? {
        ...product,
        amount,
      } : product);

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
