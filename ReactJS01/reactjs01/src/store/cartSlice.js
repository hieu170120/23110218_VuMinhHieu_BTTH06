import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCartApi } from '../util/api';

const initialState = {
  cart: { items: [], totalAmount: 0 },
  cartCount: 0,
  loading: false,
  error: null
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { items: [], totalAmount: 0 };
    }
    try {
      const res = await getCartApi();
      if (res && res.items) {
        return res;
      } else if (res && res.cart && res.cart.items) {
        return res.cart;
      }
      return { items: [], totalAmount: 0 };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action) => {
      state.cart = action.payload;
      state.cartCount = action.payload.items 
        ? action.payload.items.reduce((sum, item) => sum + item.quantity, 0)
        : 0;
    },
    clearCart: (state) => {
      state.cart = { items: [], totalAmount: 0 };
      state.cartCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.cartCount = action.payload.items 
          ? action.payload.items.reduce((sum, item) => sum + item.quantity, 0)
          : 0;
        state.loading = false;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setCart, clearCart } = cartSlice.actions;

export const selectCart = (state) => state.cart.cart;
export const selectCartCount = (state) => state.cart.cartCount;
export const selectCartLoading = (state) => state.cart.loading;

export default cartSlice.reducer;
