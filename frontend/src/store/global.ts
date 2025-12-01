import { createSlice } from "@reduxjs/toolkit";

interface GlobalState {
  navbarHidden: boolean;
  isInitializing: boolean;
}

const initialState: GlobalState = {
  navbarHidden: false,
  isInitializing: true,
};

export const globalStateSlice = createSlice({
  name: "globalState",
  initialState,
  reducers: {
    hideNavbar: (state) => {
      state.navbarHidden = true;
    },
    showNavbar: (state) => {
      state.navbarHidden = false;
    },
    setInitialized: (state) => {
      state.isInitializing = false;
    },
  },
});

export const globalStateActions = globalStateSlice.actions;

export default globalStateSlice.reducer;
