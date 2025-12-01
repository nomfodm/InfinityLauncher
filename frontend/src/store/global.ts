import { createSlice } from "@reduxjs/toolkit";

interface GlobalState {
  navbarHidden: boolean;
  isInitializing: boolean;
  showedUpdateNotification: boolean;
}

const initialState: GlobalState = {
  navbarHidden: false,
  isInitializing: true,
  showedUpdateNotification: false,
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
    setUpdateNotificationShowed: (state) => {
      state.showedUpdateNotification = true;
    },
  },
});

export const globalStateActions = globalStateSlice.actions;

export default globalStateSlice.reducer;
