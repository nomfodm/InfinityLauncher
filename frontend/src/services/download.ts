import store from "../store";
import {
    clearDownloadProgressMessage,
    download,
    downloadError,
    downloadExtract,
    fetch,
    setDownloadProgress,
    setDownloadProgressMessage, downloadSuccess
} from "../store/download";
import {
    CheckGameFilesIntegrity,
    CleanUp,
    DownloadNecessaryParts,
    ExtractNecessaryParts,
    FetchGameFilesInfo, Play, PlayWithoutAccount
} from "../wailsjs/go/main/App";
import {EventsOff, EventsOn} from "../wailsjs/runtime";
import {notifications} from "@mantine/notifications";
import {main} from "../wailsjs/go/models";
import FileStructureDamage = main.FileStructureDamage;
import authService from "./auth";
import {gameError, gameIdle, playing, setGameStatusMessage} from "../store/game";

class DownloadService {
    async play(gameProfileID: number) {
        await this.verifyAndDownloadFilesIfNeeded(gameProfileID)
    }

    async verifyAndDownloadFilesIfNeeded(gameProfileID: number) {
        store.dispatch(gameIdle())
        store.dispatch(fetch(gameProfileID))
        store.dispatch(setDownloadProgressMessage("Проверка целостности файлов..."))

        await new Promise(resolve => setTimeout(resolve, 1000))

        EventsOn("setFilenameOfCurrentFile", (data: {filename: string}) => store.dispatch(setDownloadProgressMessage(`Проверка целостности файлов (${data.filename})...`)))
        const filesIntegrity = await this.verifyFiles(gameProfileID)
        EventsOff("setFilenameOfCurrentFile")

        if (filesIntegrity.assetsDamaged || filesIntegrity.librariesDamaged || filesIntegrity.modsDamaged || filesIntegrity.runtimeDamaged || filesIntegrity.versionsDamaged) {
            const downloadResult = await this.downloadNecessaryParts(gameProfileID, filesIntegrity)
            if (!downloadResult) {
                return
            }
            const extractionResult = await this.extractNecessaryParts(gameProfileID, filesIntegrity)
            if (!extractionResult) {
                return
            }
            await CleanUp(gameProfileID, filesIntegrity)
        }

        store.dispatch(downloadSuccess())
        await new Promise(resolve => setTimeout(resolve, 1000))

        try {
            const authState = store.getState().auth
            if (authState.authed) {
                await authService.me() // refresh token
                const token = localStorage.getItem("token")!
                store.dispatch(playing(gameProfileID))
                store.dispatch(setGameStatusMessage("Игра запущена"))
                await Play(gameProfileID, token)
            } else {
                store.dispatch(playing(gameProfileID))
                store.dispatch(setGameStatusMessage("Игра запущена"))
                await PlayWithoutAccount(gameProfileID)
            }
            store.dispatch(gameIdle())
        } catch (e) {
            store.dispatch(gameError())
            store.dispatch(setGameStatusMessage(e as string))
            console.log(e)
        }

    }

    async verifyFiles(gameProfileID: number): Promise<FileStructureDamage> {
        const filesInfo = await FetchGameFilesInfo(gameProfileID)
        return await CheckGameFilesIntegrity(gameProfileID, filesInfo)
    }

    async downloadNecessaryParts(gameProfileID: number, filesIntegrity: FileStructureDamage): Promise<boolean> {
        store.dispatch(download())

        EventsOn("setDownloadProgress", (data: {value: number, total: number, speed: number}) => {
            store.dispatch(setDownloadProgress({downloadSpeed: data.speed, progressTotal: data.total, progressValue: data.value}))
        })
        EventsOn("setDownloadProgressMessage", (data: {message: string}) => {
            switch (data.message) {
                case "assets": {
                    store.dispatch(setDownloadProgressMessage("Загружаю ассеты игры..."))
                    break
                }
                case "libraries": {
                    store.dispatch(setDownloadProgressMessage("Загружаю игровые библиотеки..."))
                    break
                }
                case "mods": {
                    store.dispatch(setDownloadProgressMessage("Загружаю моды..."))
                    break
                }
                case "runtime": {
                    store.dispatch(setDownloadProgressMessage("Загружаю исполняющий модуль..."))
                    break
                }
                case "versions":
                    store.dispatch(setDownloadProgressMessage("Загружаю версии игры..."))
                    break
            }
        })
        try {
            await DownloadNecessaryParts(gameProfileID, filesIntegrity)
        } catch (e) {
            if (e === "canceled") {
                store.dispatch(clearDownloadProgressMessage())
                return false
            }
            store.dispatch(downloadError())
            notifications.show({
                autoClose: false,
                message: e as string,
                color: "red"
            })
            EventsOff("setDownloadProgress")
            EventsOff("setDownloadProgressMessage")
            return false
        } finally {
            EventsOff("setDownloadProgress")
            EventsOff("setDownloadProgressMessage")
        }
        return true
    }

    async extractNecessaryParts(gameProfileID: number, filesIntegrity: FileStructureDamage): Promise<boolean> {
        store.dispatch(downloadExtract())

        EventsOn("setExtractProgress", (data: {filename: string, size: number, value: number, total: number}) => {
            store.dispatch(setDownloadProgressMessage(`${data.filename} | ${data.size.toFixed(4)} Mb`))
            store.dispatch(setDownloadProgress({progressValue: data.value, progressTotal: data.total, downloadSpeed: 0.0}))
        })
        try {
            await ExtractNecessaryParts(gameProfileID, filesIntegrity)
        } catch (e) {
            if (e === "unzip canceled") {
                store.dispatch(clearDownloadProgressMessage())
                return false
            }
            store.dispatch(downloadError())
            notifications.show({
                autoClose: false,
                message: e as string,
                color: "red"
            })
            EventsOff("setExtractProgress")
            return false
        } finally {
            EventsOff("setExtractProgress")
        }
        return true
    }
}

export default new DownloadService()