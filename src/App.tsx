import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { useAsync, DataContext } from "./hooks/useData";
import { dataRepository } from "./services/data";
import { Layout } from "./components/Layout";
import { ErrorState, Loading } from "./components/States";
const Home = lazy(() => import("./pages/Home")),
  Daily = lazy(() => import("./pages/Daily")),
  Industry = lazy(() => import("./pages/Industry")),
  History = lazy(() => import("./pages/History")),
  Exceptions = lazy(() => import("./pages/Exceptions")),
  About = lazy(() => import("./pages/About")),
  StockHistory = lazy(() => import("./pages/StockHistory"));
export default function App() {
  const index = useAsync("index", () => dataRepository.index());
  if (index.error)
    return <ErrorState message={index.error} retry={index.retry} />;
  if (!index.data) return <Loading />;
  return (
    <DataContext value={index.data}>
      <BrowserRouter
        basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
      >
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="daily/:date?" element={<Daily />} />
              <Route path="industry/:date?" element={<Industry />} />
              <Route path="history" element={<History />} />
              <Route path="exceptions/:date?" element={<Exceptions />} />
              <Route path="about" element={<About />} />
              <Route path="stock/:code" element={<StockHistory />} />
              <Route
                path="*"
                element={
                  <div className="state">
                    <h1>页面不存在</h1>
                    <Link className="button" to="/">
                      返回首页
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DataContext>
  );
}
