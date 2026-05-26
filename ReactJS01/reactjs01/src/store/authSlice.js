import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../util/axios.customize';

const initialState = {
  isAuthenticated: false,
  user: {
    email: '',
    name: '',
    role: ''
  },
  appLoading: false,
  error: null
};

export const fetchAccount = createAsyncThunk(
  'auth/fetchAccount',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return rejectWithValue('No token');
    }
    try {
      const res = await axios.get('/v1/api/account');
      return res;
    } catch (error) {
      localStorage.removeItem('access_token');
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = { email: '', name: '', role: '' };
      localStorage.removeItem('access_token');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccount.pending, (state) => {
        state.appLoading = true;
        state.error = null;
      })
      .addCase(fetchAccount.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = {
          email: action.payload.email,
          name: action.payload.name,
          role: action.payload.role
        };
        state.appLoading = false;
      })
      .addCase(fetchAccount.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = { email: '', name: '', role: '' };
        state.appLoading = false;
        state.error = action.payload;
      });
  }
});

export const { login, logout, clearError } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAppLoading = (state) => state.auth.appLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
