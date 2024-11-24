import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export enum GameStatus {
    IDLE,
    PLAYING,
    ERROR
}

interface GameState {
    status: GameStatus;
    clientIDPlaying?: number;
    statusMessage: string;
}

const initialState: GameState = {
    status: GameStatus.IDLE,
    clientIDPlaying: undefined,
    statusMessage: "",
}

export const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        gameIdle: (state) => {
            state.status = GameStatus.IDLE
            state.clientIDPlaying = undefined
        },
        playing: (state, action: PayloadAction<number>) => {
            state.status = GameStatus.PLAYING
            state.clientIDPlaying = action.payload
        },
        gameError: (state) => {
            state.status = GameStatus.ERROR
        },
        setGameStatusMessage: (state, action: PayloadAction<string>) => {
            state.statusMessage = action.payload
        }
    }
})

export const {gameIdle, gameError, setGameStatusMessage, playing} = gameSlice.actions

export default gameSlice.reducer
