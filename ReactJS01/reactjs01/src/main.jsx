import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from './pages/login.jsx';
import RegisterPage from './pages/register.jsx';
import UserPage from './pages/user.jsx';
import HomePage from './pages/home.jsx';
import ProductDetail from './pages/product-detail.jsx';
import SearchPage from './pages/search.jsx';
import ProductManagement from './pages/admin/ProductManagement.jsx';
import BannerManagement from './pages/admin/BannerManagement.jsx';
import AdminOrderManagement from './pages/admin/AdminOrderManagement.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import CartPage from './pages/cart.jsx';
import CheckoutPage from './pages/checkout.jsx';
import OrderSuccessPage from './pages/order-success.jsx';
import OrderHistoryPage from './pages/order-history.jsx';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import './styles/global.css';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "user",
        element: <UserPage />,
      },
      {
        path: "product/:id",
        element: <ProductDetail />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "order-success",
        element: <OrderSuccessPage />,
      },
      {
        path: "orders",
        element: <OrderHistoryPage />,
      },
      {
        path: "admin/products",
        element: <ProductManagement />,
      },
      {
        path: "admin/banners",
        element: <BannerManagement />,
      },
      {
        path: "admin/orders",
        element: <AdminOrderManagement />,
      },
      {
        path: "category/:categoryId",
        element: <CategoryPage />,
      },
    ],
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "register",
    element: <RegisterPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
)
