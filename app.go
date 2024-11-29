package main

import (
	"C"
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/tidwall/gjson"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"math/rand"
	"os/exec"
	"path"
	"strings"
	"syscall"
)

var (
	updateFound = errors.New("update found")
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	runtime.WindowCenter(ctx)
}

func (a *App) domready(ctx context.Context) {
	runtime.WindowShow(a.ctx)
}

func (a *App) Init() error {
	err := CheckSystem()
	if err != nil {
		return err
	}

	fs := NewFS()
	err = fs.InitFS()
	if err != nil {
		return errors.New("Ошибка инициализации файлового модуля: " + err.Error())
	}
	return nil
}

func (a *App) OpenDirectoryDialog(defaultDirectory string) (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{DefaultDirectory: defaultDirectory, Title: "Выберите папку"})
}

func (a *App) FetchGameFilesInfo(profileID int) (FileStructureHashInfo, error) {
	return FetchGameFilesInfo(profileID)
}

func (a *App) CheckGameFilesIntegrity(profileID int, filesInfoFromServer FileStructureHashInfo) (FileStructureDamage, error) {
	return CheckGameFilesIntegrity(a.ctx, profileID, filesInfoFromServer)
}

func (a *App) DownloadNecessaryParts(profileID int, damage FileStructureDamage) error {
	err := a.DeleteDamagedParts(profileID, damage)
	if err != nil {
		return err
	}

	assetsZipPath, librariesZipPath, modsZipPath, runtimeZipPath, versionsZipPath, err := GetGameClientFoldersPaths(profileID, ".zip")
	if err != nil {
		return err
	}

	if damage.AssetsDamaged {
		runtime.EventsEmit(a.ctx, "setDownloadProgressMessage", Dict{"message": "assets"})
		err := a.DownloadFile(fmt.Sprintf(assetsZipUrl, profileID), assetsZipPath)
		if err != nil {
			return err
		}
	}

	if damage.LibrariesDamaged {
		runtime.EventsEmit(a.ctx, "setDownloadProgressMessage", Dict{"message": "libraries"})
		err := a.DownloadFile(fmt.Sprintf(librariesZipUrl, profileID), librariesZipPath)
		if err != nil {
			return err
		}
	}

	if damage.ModsDamaged {
		runtime.EventsEmit(a.ctx, "setDownloadProgressMessage", Dict{"message": "mods"})
		err := a.DownloadFile(fmt.Sprintf(modsZipUrl, profileID), modsZipPath)
		if err != nil {
			return err
		}
	}

	if damage.RuntimeDamaged {
		runtime.EventsEmit(a.ctx, "setDownloadProgressMessage", Dict{"message": "runtime"})
		err := a.DownloadFile(fmt.Sprintf(runtimeZipUrl, profileID), runtimeZipPath)
		if err != nil {
			return err
		}
	}

	if damage.VersionsDamaged {
		runtime.EventsEmit(a.ctx, "setDownloadProgressMessage", Dict{"message": "versions"})
		err := a.DownloadFile(fmt.Sprintf(versionsZipUrl, profileID), versionsZipPath)
		if err != nil {
			return err
		}
	}

	return nil
}

func (a *App) CleanUp(profileID int, damage FileStructureDamage) error {
	return CleanUp(profileID, damage)
}

func (a *App) DeleteDamagedParts(profileID int, damage FileStructureDamage) error {
	return DeleteDamagedParts(profileID, damage)
}

func (a *App) ExtractNecessaryParts(profileID int, damage FileStructureDamage) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	runtime.EventsOnce(a.ctx, "cancel", func(optionalData ...interface{}) {
		cancel()
	})
	defer runtime.EventsOff(a.ctx, "cancel")
	return ExtractNecessaryParts(ctx, profileID, damage, func(filename string, size float64, value int64, total int64) {
		runtime.EventsEmit(a.ctx, "setExtractProgress", map[string]any{"filename": filename, "size": size, "value": value, "total": total})
	})
}

func (a *App) DownloadFile(url, filePath string) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	runtime.EventsOnce(a.ctx, "cancel", func(optionalData ...interface{}) {
		cancel()
	})
	defer runtime.EventsOff(a.ctx, "cancel")
	return DownloadFile(ctx, url, Dict{}, filePath, func(value, total int64, speed float64) {
		runtime.EventsEmit(a.ctx, "setDownloadProgress", map[string]any{"value": value, "total": total, "speed": speed})
	})
}

func (a *App) Play(profileID int, accessToken string) error {
	commandRaw, err := RetrieveRunCommand(profileID)
	if err != nil {
		return err
	}

	minecraftData, err := RequestMinecraftUserData(accessToken)
	if err != nil {
		return err
	}

	fs := NewFS()
	gameClientConfig, err := fs.ReadGameProfileConfig(profileID)
	if err != nil {
		return err
	}

	runtimeExecutablePath := path.Join("runtime", "java-runtime-gamma", "bin", "java.exe")
	nativesPath := path.Join(gameClientConfig.Path, "natives")

	var command []string
	if gameClientConfig.Ram != 1024 {
		command = append(command, fmt.Sprintf("-Xmx%dM", gameClientConfig.Ram))
	}
	for _, value := range commandRaw[1:] {
		stringToAdd := strings.ReplaceAll(value, "{clientNatives}", nativesPath)
		stringToAdd = strings.ReplaceAll(stringToAdd, "{clientFolderPath}", gameClientConfig.Path)
		stringToAdd = strings.ReplaceAll(stringToAdd, "{username}", minecraftData.Username)
		stringToAdd = strings.ReplaceAll(stringToAdd, "{uuid}", minecraftData.UUID)
		stringToAdd = strings.ReplaceAll(stringToAdd, "{token}", minecraftData.AccessToken)
		command = append(command, stringToAdd)
	}

	cancelCtx, cancel := context.WithCancel(context.Background())
	defer cancel()

	runtime.EventsOnce(a.ctx, "closeGame", func(optionalData ...interface{}) {
		cancel()
	})
	defer runtime.EventsOff(a.ctx, "closeGame")

	cmd := exec.CommandContext(cancelCtx, strings.ReplaceAll(commandRaw[0], "{executablePath}", runtimeExecutablePath), command...)

	cmd.Dir = gameClientConfig.Path

	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	return cmd.Run()
}

func (a *App) PlayWithoutAccount(profileID int) error {
	commandRaw, err := RetrieveRunCommand(profileID)
	if err != nil {
		return err
	}

	fs := NewFS()
	gameClientConfig, err := fs.ReadGameProfileConfig(profileID)
	if err != nil {
		return err
	}

	runtimeExecutablePath := path.Join("runtime", "java-runtime-gamma", "bin", "java.exe")
	nativesPath := path.Join(gameClientConfig.Path, "natives")

	letterBytes := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	b := make([]byte, 10)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}

	var command []string
	if gameClientConfig.Ram != 1024 {
		command = append(command, fmt.Sprintf("-Xmx%dM", gameClientConfig.Ram))
	}
	for _, value := range commandRaw[1:] {
		stringToAdd := strings.ReplaceAll(value, "{clientNatives}", nativesPath)
		stringToAdd = strings.ReplaceAll(stringToAdd, "{clientFolderPath}", gameClientConfig.Path)
		stringToAdd = strings.ReplaceAll(stringToAdd, "{username}", string(b))
		stringToAdd = strings.ReplaceAll(stringToAdd, "{uuid}", uuid.NewString())
		stringToAdd = strings.ReplaceAll(stringToAdd, "{token}", "")
		command = append(command, stringToAdd)
	}

	fmt.Println(command)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	runtime.EventsOnce(a.ctx, "closeGame", func(optionalData ...interface{}) {
		cancel()
	})
	defer runtime.EventsOff(a.ctx, "closeGame")

	cmd := exec.CommandContext(ctx, strings.ReplaceAll(commandRaw[0], "{executablePath}", runtimeExecutablePath), command...)

	cmd.Dir = gameClientConfig.Path

	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	return cmd.Run()
}

func (a *App) CheckForUpdates() error {
	return CheckForUpdates(nil)
}

func (a *App) Update() error {
	return Update()
}

func (a *App) RestartApp() error {
	return RestartApp()
}

func (a *App) GetVersion() string {
	version := gjson.Get(wailsJSON, "info.productVersion")
	return version.String()
}
