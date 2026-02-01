import { Box, LoadingOverlay, rem } from "@mantine/core";
import { useEffect, useState } from "react";
import { Init, IsMandatoryUpdateAvailable } from "./wailsjs/go/main/App";
import LauncherUpdatingPage from "./pages/LauncherUpdating/LauncherUpdatingPage";
import App from "./App";
import authService from "./services/auth";
import gameProfiler from "./services/gameProfiler";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import InfinityLoader from "./components/InfinityLoader/InfinityLoader";
import store from "./store";
import { globalStateActions } from "./store/global";

export default function Start() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsToUpdate, setNeedsToUpdate] = useState(false);

  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function wrapper() {
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        await Init();

        const isMandatoryUpdateAvailable = await IsMandatoryUpdateAvailable();
        if (isMandatoryUpdateAvailable) {
          // setNeedsToUpdate(true);
          // return;
        }

        await authService.checkAuth();
        await gameProfiler.retrieve();

        store.dispatch(globalStateActions.setInitialized());
        setInitialized(true);
      } catch (e) {
        setError(`${e}`);
      } finally {
        setIsLoading(false);
      }
    }

    wrapper();
  }, []);

  return (
    <>
      <Box h={"100vh"} pos={"relative"}>
        <LoadingOverlay
          transitionProps={{ transition: "fade", duration: 200 }}
          visible={(isLoading || !initialized) && !needsToUpdate && !error}
          zIndex={1000}
          overlayProps={{ backgroundOpacity: 1, color: "#1f1f1f" }}
          loaderProps={{
            children: (
              <>
                <Box
                  w={rem(80)}
                  h={rem(40)}
                  style={{ filter: "grayscale(100%)" }}
                  opacity={0.2}
                >
                  <InfinityLoader />
                </Box>
              </>
            ),
          }}
        />
        {!isLoading && initialized && (
          <>
            <App />
          </>
        )}
        {needsToUpdate && (
          <>
            <LauncherUpdatingPage />
          </>
        )}
        {error && (
          <>
            <ErrorPage error={`${error}`} />
          </>
        )}
      </Box>
    </>
  );
}
