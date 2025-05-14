import store from "../store";
import {Play, StartGame, StartGameWithoutAccount,} from "../wailsjs/go/main/App";
import {EventsOff, EventsOn} from "../wailsjs/runtime";
import authService from "./auth";
import {gameActions, GameStatus} from "../store/game";

class DownloadService {
    async play(gameProfileID: number) {
        const state = store.getState()

        store.dispatch(gameActions.setClientPlayingID(gameProfileID))

        if (!state.gameProfiles.retrieved) {
            return
        }

        const profile = state.gameProfiles.profiles.at(gameProfileID - 1)
        if (!profile) {
            return
        }

        EventsOn("setProgress", (data: { total: number, done: number, status: number, error: string }) => {
            if (store.getState().game.status == GameStatus.ERROR) {
                return
            }
            if (data.status == 5) {
                EventsOff("setProgress")
                store.dispatch(gameActions.idle())
                return
            }
            if (data.status == 4) {
                store.dispatch(gameActions.error())
                store.dispatch(gameActions.setErrorMessage(data.error))

                EventsOff("setProgress")
                return
            }
            if (data.status == 3) {
                store.dispatch(gameActions.done())

                EventsOff("setProgress")
                return
            }
            if (data.status == 2) {
                store.dispatch(gameActions.preparing())

                return
            }
            if (data.status == 1) {
                store.dispatch(gameActions.downloading())
                store.dispatch(gameActions.setDownloadProgress({
                    total: Number((data.total / 1024 / 1024).toFixed(2)),
                    done: Number((data.done / 1024 / 1024).toFixed(2))
                }))

                return
            }
            if (data.status == 0) {
                store.dispatch(gameActions.fetching())

                return;
            }
        })

        EventsOn("gameStarted", () => {
            store.dispatch(gameActions.playing())
        })


        try {
            await Play(profile)
            EventsOff("setProgress")

            if (store.getState().game.status != GameStatus.DONE) {
                throw store.getState().game.error
            }

            const authState = store.getState().auth
            if (authState.authed) {
                await authService.checkAuth()
                const token = localStorage.getItem("token")!

                await StartGame(gameProfileID, token)
            } else {
                await StartGameWithoutAccount(gameProfileID)
            }
            store.dispatch(gameActions.idle())
        } catch (e) {
            console.error(e)
            store.dispatch(gameActions.setErrorMessage(e as string))
            if ((e as string).endsWith("canceled") || (e as string).startsWith("exit status")) {
                store.dispatch(gameActions.idle())
            } else {
                store.dispatch(gameActions.error())
            }
        } finally {
            EventsOff("setProgress")
            EventsOff("gameStarted")
        }
    }
}

export default new DownloadService()