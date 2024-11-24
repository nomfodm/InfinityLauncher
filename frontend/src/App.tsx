import './App.css';
import {createHashRouter, Outlet, useLocation, useRoutes} from "react-router-dom";
import Header from "./components/Header/Header";
import Floating from "./components/Floating/Floating";
import {AnimatePresence} from "framer-motion";
import MainPage from "./pages/Main/MainPage";
import PlayPage from "./pages/Play/PlayPage";
import React from "react";
import DetailPage from "./pages/Detail/DetailPage";
import SimplifiedHeader from "./components/SimplifiedHeader/SimplifiedHeader";

const router = createHashRouter([
    {
        path: "/",
        element: <>
            <Header/>
            <Outlet/>
        </>,
        children: [
            {
                index: true,
                element: <MainPage/>,
            },
            {
                path: "play",
                element: <PlayPage/>,
            },
        ],
    },
    {
        path: "/play/:id",
        element: (
            <>
                <SimplifiedHeader />
                <DetailPage />
            </>
        ),
    },
])


function App() {
    const routes = useRoutes(router.routes)
    const location = useLocation()

    return (
        <>
            <AnimatePresence mode={"wait"}>
                {React.cloneElement(routes!, {key: location.pathname})}
            </AnimatePresence>
            <Floating />
        </>

    )
}

export default App
