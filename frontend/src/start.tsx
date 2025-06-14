import {Box, Loader, LoadingOverlay, Text} from "@mantine/core";
import {HashRouter} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {Init, IsMandatoryUpdateAvailable} from "./wailsjs/go/main/App";
import SimplifiedHeaderWithoutLink from "./components/SimplifiedHeader/SimplifiedHeaderWithoutLink";
import LauncherUpdatingPage from "./pages/LauncherUpdating/LauncherUpdatingPage";
import App from "./App";
import authService from "./services/auth";
import gameProfiler from "./services/gameProfiler";

function capitalizeWord(word: string): string {
    if (!word) return ""
    return word[0].toUpperCase() + word.substring(1);
}

export default function Start() {
    const [isLoading, setIsLoading] = useState(true);
    const [needsToUpdate, setNeedsToUpdate] = useState(false);

    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState("")

    useEffect(() => {
        async function wrapper() {
            await new Promise(resolve => setTimeout(resolve, 200));

            try {
                await Init();

                const isMandatoryUpdateAvailable = await IsMandatoryUpdateAvailable()
                if (isMandatoryUpdateAvailable) {
                    setNeedsToUpdate(true)
                    return
                }

                await authService.checkAuth()
                await gameProfiler.retrieve()

                setInitialized(true);
            } catch (e) {
                if (`${e}` == "cantcheckupdate") {
                    setNeedsToUpdate(true)
                    return
                }
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
                                        {isLoading
                                            ? <Loader color="blue"/>
                                            : <Text fz={"xl"} ta={"center"}>{capitalizeWord(error)}</Text>}
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
                    <LauncherUpdatingPage/>
                </>}
            </Box>
        </>
    )


}