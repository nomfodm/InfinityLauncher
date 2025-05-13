import {configureStore} from "@reduxjs/toolkit";
import AuthReducer from "./store/auth"
import GameProfilesReducer from "./store/gameprofiles"
import GameReducer from "./store/game"
import LauncherUpdateReducer from "./store/launcherUpdate"

export const store = configureStore({
    reducer: {
        auth: AuthReducer,
        gameProfiles: GameProfilesReducer,
        game: GameReducer,
        launcherUpdate: LauncherUpdateReducer
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store

export default store