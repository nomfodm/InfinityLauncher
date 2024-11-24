import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {main} from "../wailsjs/go/models";
import User = main.User;

interface AuthState {
    authed: boolean;
    authing: boolean;
    user?: User;
    error: string;
}

const initialState: AuthState = {
    authed: false,
    authing: false,
    user: undefined,
    error: ""
}

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        authing: (state) => {
            state.authing = true
            state.error = ""
        },
        login: (state, action: PayloadAction<User>) => {
            state.authed = true
            state.authing = false
            state.error = ""
            state.user = action.payload
        },
        logout: (state) => {
            state.authed = false
            state.authing = false
            state.error = ""
            state.user = undefined
        },
        setAuthError: (state, action: PayloadAction<string>) => {
            state.error = action.payload
        },
        clearAuthError: (state) => {
            state.error = ""
        }
    }
})

export const {authing, login, logout, setAuthError, clearAuthError} = authSlice.actions

export default authSlice.reducer
