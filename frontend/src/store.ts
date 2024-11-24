import {configureStore} from "@reduxjs/toolkit";
import AuthReducer from "./store/auth"
import GameProfilesReducer from "./store/gameprofiles"
import DownloadReducer from "./store/download"
import GameReducer from "./store/game"

export const store = configureStore({
    reducer: {
        auth: AuthReducer,
        gameProfiles: GameProfilesReducer,
        download: DownloadReducer,
        game: GameReducer
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store

export default store