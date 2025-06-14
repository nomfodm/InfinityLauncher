import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export enum LauncherUpdateStatus {
    IDLE,
    UPDATING,
    RESTARTING,
    ERROR,
}



interface LauncherUpdateState {
    status: LauncherUpdateStatus;
    countdown: number;
    error?: string;
}

const initialState: LauncherUpdateState = {
    status: LauncherUpdateStatus.IDLE,
    countdown: 20,
    error: undefined
}

export const launcherUpdateSlice = createSlice({
    name: "launcherUpdate",
    initialState,
    reducers: {
        updating: (state) => {
            state.status = LauncherUpdateStatus.UPDATING;
        },
        launcherUpdateDecreaseCountdown: (state) => {
            state.countdown--;
        },
        error: (state) => {
            state.status = LauncherUpdateStatus.ERROR;
        },
        restarting: (state) => {
            state.status = LauncherUpdateStatus.RESTARTING
        },
        setErrorMessage: (state, action: PayloadAction<string>) => {
            state.error = action.payload
        },
    }
})

export const launcherUpdateActions = launcherUpdateSlice.actions

export default launcherUpdateSlice.reducer
