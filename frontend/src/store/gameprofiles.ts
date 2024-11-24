import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {main} from "../wailsjs/go/models";
import GameProfile = main.GameProfile;

interface GameProfiles {
    retrieved: boolean;
    profiles: GameProfile[];
    error: string;
}

const initialState: GameProfiles = {
    retrieved: false,
    profiles: [],
    error: "Получаю игровые режимы..."
}

export const gameProfilesSlice = createSlice({
    name: "gameProfiles",
    initialState,
    reducers: {
        setGameProfiles: (state, action: PayloadAction<GameProfile[]>) => {
            state.retrieved = true
            state.error = ""
            state.profiles = action.payload
        },
        clearGameProfiles: (state) => {
            state.retrieved = false
            state.error = ""
            state.profiles = []
        },
        setGameProfilesError: (state, action: PayloadAction<string>) => {
            state.error = action.payload
        },
        clearGameProfilesError: (state) => {
            state.error = ""
        }
    }
})

export const {
    setGameProfiles,
    clearGameProfiles,
    setGameProfilesError,
    clearGameProfilesError
} = gameProfilesSlice.actions

export default gameProfilesSlice.reducer