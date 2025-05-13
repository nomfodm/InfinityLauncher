import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export enum GameStatus {
    IDLE,
    FETCHING,
    DOWNLOADING,
    PREPARING,
    PLAYING,
    DONE,
    ERROR,
}

interface GameState {
    status: GameStatus;
    clientPlayingID?: number;
    downloadProgress: DownloadProgress
    error?: string;
}

interface DownloadProgress {
    total: number;
    done: number;
}

const initialState: GameState = {
    status: GameStatus.IDLE,
    clientPlayingID: undefined,
    downloadProgress: {
        done: 1,
        total: 1
    },
    error: undefined,
}

export const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        idle: (state) => {
            state.status = GameStatus.IDLE
        },
        fetching: (state) => {
            state.status = GameStatus.FETCHING
        },
        downloading: (state) => {
            state.status = GameStatus.DOWNLOADING
        },
        preparing: (state) => {
            state.status = GameStatus.PREPARING
        },
        playing: (state) => {
            state.status = GameStatus.PLAYING
        },
        done: (state) => {
            state.status = GameStatus.DONE
        },
        error: (state) => {
            state.status = GameStatus.ERROR
        },
        setErrorMessage: (state, action: PayloadAction<string>) => {
            state.error = action.payload
        },
        setClientPlayingID: (state, action: PayloadAction<number>) => {
            state.clientPlayingID = action.payload
        },
        setDownloadProgress: (state, action: PayloadAction<DownloadProgress>) => {
            state.downloadProgress = action.payload
        }
    }
})

export const gameActions = gameSlice.actions

export default gameSlice.reducer
