import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export enum DownloadStatus {
    IDLE,
    FETCHING,
    DOWNLOADING,
    EXTRACTING,
    SUCCESS,
    ERROR,
}

interface DownloadState {
    status: DownloadStatus;
    clientDownloadingID?: number;
    downloadProgress: {
        progressMessage: string;
        progressValue: number;
        progressTotal: number;
        downloadSpeed: number;
    }
}

interface DownloadProgress {
    progressValue: number;
    progressTotal: number;
    downloadSpeed: number;
}

const initialState: DownloadState = {
    status: DownloadStatus.IDLE,
    clientDownloadingID: undefined,
    downloadProgress: {
        progressMessage: "",
        progressValue: 0,
        progressTotal: 0,
        downloadSpeed: 0.0,
    }
}

export const downloadSlice = createSlice({
    name: "download",
    initialState,
    reducers: {
        download: (state) => {
            state.status = DownloadStatus.DOWNLOADING;
            state.downloadProgress.downloadSpeed = 0.0;
            state.downloadProgress.progressValue = 0;
            state.downloadProgress.progressTotal = 0;
        },
        setDownloadProgress: (state, action: PayloadAction<DownloadProgress>) => {
            state.downloadProgress.downloadSpeed = action.payload.downloadSpeed;
            state.downloadProgress.progressValue = action.payload.progressValue;
            state.downloadProgress.progressTotal = action.payload.progressTotal;
        },
        fetch: (state, action: PayloadAction<number>) => {
            state.status = DownloadStatus.FETCHING
            state.clientDownloadingID = action.payload;
        },
        setDownloadProgressMessage: (state, action: PayloadAction<string>) => {
            state.downloadProgress.progressMessage = action.payload
        },
        clearDownloadProgressMessage: (state) => {
            state.downloadProgress.progressMessage = ""
        },
        downloadExtract: (state) => {
            state.status = DownloadStatus.EXTRACTING
        },
        downloadError: (state) => {
            state.status = DownloadStatus.ERROR
        },
        downloadSuccess: (state) => {
            state.status = DownloadStatus.SUCCESS
        },
        downloadIdle: (state) => {
            state.status = DownloadStatus.IDLE;
        }
    }
})

export const {download, downloadIdle, setDownloadProgress, downloadExtract, downloadSuccess, downloadError, setDownloadProgressMessage, clearDownloadProgressMessage, fetch} = downloadSlice.actions

export default downloadSlice.reducer