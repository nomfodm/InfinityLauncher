import "./App.css";
import {
  createHashRouter,
  Outlet,
  useLocation,
  useNavigate,
  useRoutes,
} from "react-router-dom";
import { AnimatePresence } from "motion/react";
import PlayPage from "./pages/Play/PlayPage";
import React, { useEffect } from "react";
import DetailPage from "./pages/Detail/DetailPage";
import Navbar from "./components/Navbar/Navbar";
import { Anchor, Box, Flex, rem } from "@mantine/core";
import UserPage from "./pages/User/UserPage";
import LauncherInfoPage from "./pages/LauncherInfo/LauncherInfoPage";
import { useAppSelector } from "./store/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertHexagon } from "@tabler/icons-react";
import { IsAnyUpdateAvailable } from "./wailsjs/go/main/App";
import store from "./store";
import { globalStateActions } from "./store/global";

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

  const showedNotification = useAppSelector(
    (state) => state.globalState.showedUpdateNotification
  );
  const navigate = useNavigate();

  async function notifyUserAboutUnmandatoryUpdate() {
    if (showedNotification) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const isUpdate = await IsAnyUpdateAvailable();
    if (isUpdate) {
      if (!showedNotification) {
        const notificationID = notifications.show({
          title: "Найдены необязательные обновления",
          message: (
            <Anchor
              fz={"sm"}
              onClick={() => {
                navigate("/launcherinfo");
                notifications.hide(notificationID);
              }}
            >
              Обновиться
            </Anchor>
          ),
          color: "transparent",
          icon: (
            <IconAlertHexagon
              style={{ width: rem(20), height: rem(20) }}
              color={"yellow"}
            />
          ),
        });
        store.dispatch(globalStateActions.setUpdateNotificationShowed());
      }
    }
  }

  useEffect(() => {
    notifyUserAboutUnmandatoryUpdate();
  }, []);

  return (
    <>
      <AnimatePresence mode={"wait"}>
        {React.cloneElement(routes!, { key: location.pathname })}
      </AnimatePresence>
    </>
  );
}

export default App;
