import { Outlet } from "react-router-dom";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchAccount, selectAppLoading } from "./store/authSlice";
import { fetchCart } from "./store/cartSlice";
import { Spin } from "antd";

function App() {
  const dispatch = useDispatch();
  const appLoading = useSelector(selectAppLoading);

  useEffect(() => {
    dispatch(fetchAccount());
    dispatch(fetchCart());
  }, [dispatch]);

  return (
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
  );
}

export default App
