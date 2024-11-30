import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface LauncherUpdateState {
    message: string;
    updating: boolean;
    countdown: number;
    error: boolean;
    restarting: boolean;
}

const initialState: LauncherUpdateState = {
    message: "Найдено обновление",
    updating: false,
    countdown: 10,
    error: false,
    restarting: false
}

export const launcherUpdateSlice = createSlice({
    name: "launcherUpdate",
    initialState,
    reducers: {
        setLauncherUpdateMessage: (state, action: PayloadAction<string>) => {
            state.message = action.payload;
        },
        setLauncherUpdating: (state, action: PayloadAction<boolean>) => {
            state.message = "Обновление...";
            state.updating = action.payload;
        },
        launcherUpdateDecreaseCountdown: (state) => {
            state.countdown--;
        },
        setLauncherUpdateError: (state, action: PayloadAction<boolean>) => {
            state.message = "Ошибка обновления";
            state.error = action.payload;
        },
        setLauncherRestarting: (state, action: PayloadAction<boolean>) => {
            state.message = "Перезапуск...";
            state.restarting = action.payload;
        }
    }
})

export const {setLauncherUpdateMessage, setLauncherUpdateError, setLauncherUpdating, setLauncherRestarting, launcherUpdateDecreaseCountdown} = launcherUpdateSlice.actions

export default launcherUpdateSlice.reducer
