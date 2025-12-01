import React from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles.css";
import { createTheme, MantineProvider, Modal } from "@mantine/core";

import MantineModal from "./theme/MantineModal.module.css";
import { Provider } from "react-redux";
import store from "./store";
import { Notifications } from "@mantine/notifications";
import NotificationsClasses from "./theme/Notifications.module.css";
import { ModalsProvider } from "@mantine/modals";
import Start from "./start";
import WindowHeader from "./components/WindowHeader/WindowHeader";
import { HashRouter } from "react-router-dom";

const container = document.getElementById("root");
const root = createRoot(container!);

const theme = createTheme({
  primaryColor: "blue",
  fontFamily: "Montserrat, sans-serif",
  scale: 1,
  components: {
    Modal: Modal.extend({
      classNames: MantineModal,
    }),
    Notification: Notifications.extend({
      classNames: NotificationsClasses,
    }),
  },
});

root.render(
  <MantineProvider theme={theme} defaultColorScheme={"dark"}>
    <Provider store={store}>
      <HashRouter>
        <WindowHeader />
        <ModalsProvider>
          <Notifications />
          <Start />
        </ModalsProvider>
      </HashRouter>
    </Provider>
  </MantineProvider>
);
