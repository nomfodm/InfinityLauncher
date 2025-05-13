import store from "../store";
import {
    Play, StartGame, StartGameWithoutAccount,
} from "../wailsjs/go/main/App";
import {EventsOff, EventsOn} from "../wailsjs/runtime";
import authService from "./auth";
import {gameActions} from "../store/game";

const statuses = [
    gameActions.fetching,
    gameActions.downloading,
    gameActions.preparing,
    gameActions.done,
    gameActions.error,
]

class DownloadService {
    async play(gameProfileID: number) {
        const state = store.getState()

        if (!state.gameProfiles.retrieved) {
            return
        }

        const profile = state.gameProfiles.profiles.at(gameProfileID - 1)
        if (!profile) {
            return
        }

        EventsOn("setProgress", (data: {total: number, done: number, status: number, error: string}) => {
            if ((data.status == 4 && data.error.endsWith("canceled")) || data.status == 5) {
                store.dispatch(gameActions.idle())
                return
            }
            store.dispatch(statuses[data.status]())
            store.dispatch(gameActions.setDownloadProgress({total: Number((data.total / 1024 / 1024).toFixed(2)), done: Number((data.done / 1024 / 1024).toFixed(2))}))
            store.dispatch(gameActions.setErrorMessage(data.error))
        })


        try {
            await Play(profile)

            store.dispatch(gameActions.playing())

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
            store.dispatch(gameActions.setErrorMessage(e as string))
            if ((e as string).endsWith("canceled") || (e as string).startsWith("exit status")) {
                store.dispatch(gameActions.idle())
            } else {
                store.dispatch(gameActions.error())
            }
        } finally {
            EventsOff("setProgress")
        }
    }
}

export default new DownloadService()