import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getCartApi } from '../../util/api';

export const CartContext = createContext({
    cart: { items: [], totalAmount: 0 },
    cartCount: 0,
    loading: false,
    fetchCart: () => {},
    setCart: () => {}
});

export const CartWrapper = ({ children }) => {
    const [cart, setCart] = useState({ items: [], totalAmount: 0 });
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setCart({ items: [], totalAmount: 0 });
            return;
        }

        setLoading(true);
        try {
            const res = await getCartApi();
            if (res && res.items) {
                setCart(res);
            } else if (res && res.cart && res.cart.items) {
                setCart(res.cart);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const cartCount = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    return (
        <CartContext.Provider value={{
            cart,
            cartCount,
            loading,
            fetchCart,
            setCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
