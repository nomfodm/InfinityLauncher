import "./App.css";
import {
  createHashRouter,
  Outlet,
  useLocation,
  useRoutes,
} from "react-router-dom";
import { AnimatePresence } from "motion/react";
import PlayPage from "./pages/Play/PlayPage";
import React from "react";
import DetailPage from "./pages/Detail/DetailPage";
import Navbar from "./components/Navbar/Navbar";
import { Box, Flex, rem } from "@mantine/core";
import UserPage from "./pages/User/UserPage";
import LauncherInfoPage from "./pages/LauncherInfo/LauncherInfoPage";
import { useAppSelector } from "./store/hooks";

function Layout() {
  const navbarHidden = useAppSelector(
    (state) => state.globalState.navbarHidden
  );

  return (
    <Flex
      gap={rem(10)}
      p={rem(10)}
      justify={navbarHidden ? "center" : "flex-start"}
    >
      <Navbar />
      <Box style={{ overflow: "visible" }}>
        <Outlet />
      </Box>
    </Flex>
  );
}

const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <PlayPage />,
      },
      {
        path: "user",
        element: <UserPage />,
      },
      {
        path: "/play/:id",
        element: <DetailPage />,
      },
      {
        path: "launcherinfo",
        element: <LauncherInfoPage />,
      },
    ],
  },
]);

function App() {
  const routes = useRoutes(router.routes);
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode={"wait"}>
        {React.cloneElement(routes!, { key: location.pathname })}
      </AnimatePresence>
    </>
  );
}

export default App;
