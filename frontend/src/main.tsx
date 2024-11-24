import React from 'react'
import {createRoot} from 'react-dom/client'
import "@mantine/core/styles.css"
import '@mantine/notifications/styles.css';
import './styles.css'
import App from './App'
import {createTheme, MantineProvider, Modal} from "@mantine/core";
import {HashRouter} from "react-router-dom";

import MantineModal from "./theme/MantineModal.module.css";
import {Provider} from "react-redux";
import store from "./store";
import ErrorPage from "./pages/Error/ErrorPage";
import SimplifiedHeaderWithoutLink from "./components/SimplifiedHeader/SimplifiedHeaderWithoutLink";
import FloatingWithoutUser from "./components/Floating/FloatingWithoutUser";
import {Notifications} from "@mantine/notifications";
import NotificationsClasses from "./theme/Notifications.module.css"
import {Init} from "./wailsjs/go/main/App";
import {ModalsProvider} from "@mantine/modals";

const container = document.getElementById('root')
const root = createRoot(container!)

const theme = createTheme({
    primaryColor: "blue",
    fontFamily: "Inter, sans-serif",
    scale: 1,
    components: {
        Modal: Modal.extend({
            classNames: MantineModal
        }),
        Notification: Notifications.extend({
            classNames: NotificationsClasses
        })
    }
})

Init().then(() => root.render(
    <React.StrictMode>
        <MantineProvider theme={theme} defaultColorScheme={"dark"}>
            <ModalsProvider>
                <Notifications/>
                <Provider store={store}>
                    <HashRouter>
                        <App/>
                    </HashRouter>
                </Provider>
            </ModalsProvider>
        </MantineProvider>
    </React.StrictMode>
)).catch((e) => root.render(
    <React.StrictMode>
        <MantineProvider theme={theme} defaultColorScheme={"dark"}>
            <SimplifiedHeaderWithoutLink/>
            <FloatingWithoutUser/>
            <ErrorPage error={`${e}`}/>
        </MantineProvider>
    </React.StrictMode>
))


