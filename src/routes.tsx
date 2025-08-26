import { createBrowserRouter } from "react-router-dom";
import Layout from "./layout";
import Home from "./pages/home";
import DebateStage from "./pages/debate-stage";
import Result from "./pages/result";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/debate",
        element: <DebateStage />,
      },
      {
        path: "/result",
        element: <Result />,
      },
    ],
  },
]);