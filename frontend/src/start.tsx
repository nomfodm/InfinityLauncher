import {Box, Loader, LoadingOverlay, Text} from "@mantine/core";
import {HashRouter} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {CheckForUpdates, Init} from "./wailsjs/go/main/App";
import SimplifiedHeaderWithoutLink from "./components/SimplifiedHeader/SimplifiedHeaderWithoutLink";
import CloseMinimiseButtons from "./components/Floating/CloseMinimiseButtons";
import LauncherUpdatingPage from "./pages/LauncherUpdating/LauncherUpdatingPage";
import App from "./App";
import authService from "./services/auth";
import gameProfiler from "./services/gameProfiler";

export default function Start() {
    const [isLoading, setIsLoading] = useState(true);
    const [needsToUpdate, setNeedsToUpdate] = useState(false);

    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState("")

    useEffect(() => {
        async function wrapper() {
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                await Init();

                const updateAvailable = await CheckForUpdates()
                if (updateAvailable) {
                    setNeedsToUpdate(true)
                    return
                }

                await authService.checkAuth()
                await gameProfiler.retrieve()

                setInitialized(true);
            } catch (e) {
                setError(`${e}`);

            } finally {
                setIsLoading(false);
            }



        }

        wrapper()
    }, [])


    return (
        <>
            <Box h={"100vh"} pos={"relative"}>
                <LoadingOverlay transitionProps={{transition: "fade", duration: 500}}
                                visible={(isLoading || !initialized) && !needsToUpdate}
                                zIndex={1000}
                                overlayProps={{backgroundOpacity: 1, color: "#090a19"}}
                                loaderProps={{
                                    children:
                                    <>
                                        <SimplifiedHeaderWithoutLink/>
                                        {isLoading
                                            ? <Loader color="blue"/>
                                            : <Text fz={"xl"} ta={"center"}>{error}</Text>}
                                    </>
                                }}
                />
                {!isLoading && initialized && <>
                    <HashRouter>
                        <App/>
                    </HashRouter>
                </>}
                {needsToUpdate && <>
                    <SimplifiedHeaderWithoutLink/>
                    <CloseMinimiseButtons/>
                    <LauncherUpdatingPage/>
                </>}
            </Box>
        </>
    )


}