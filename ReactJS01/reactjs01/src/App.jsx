import { Outlet } from "react-router-dom";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";
import axios from "./util/axios.customize";
import { useContext, useEffect } from "react";
import { AuthContext } from "./components/context/auth.context";
import { CartWrapper } from "./components/context/cart.context";
import { Spin } from "antd";

function App() {
  const { setAuth, appLoading, setAppLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchAccount = async () => {
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('access_token');
      if (!token) {
        setAppLoading(false);
        return;
      }

      setAppLoading(true);
      try {
        const res = await axios.get('/v1/api/account');
        if (res && !res.message) {
          setAuth({
            isAuthenticated: true,
            user: {
              email: res.email,
              name: res.name,
              role: res.role
            }
          })
        }
      } catch (error) {
        // Token không hợp lệ hoặc hết hạn
        console.error('Account fetch error:', error);
        localStorage.removeItem('access_token');
        setAuth({
          isAuthenticated: false,
          user: { email: '', name: '', role: '' }
        });
      } finally {
        setAppLoading(false);
      }
    }

    fetchAccount();
  }, [])

  return (
    <CartWrapper>
      <div>
        {appLoading === true ?
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}>
            <Spin />
          </div>
          :
          <>
            <Header />
            <main className="flex-grow">
              <Outlet />
            </main>
            <Footer />
          </>
        }
      </div>
    </CartWrapper>
  );
}

export default App