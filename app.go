package main

import (
	"C"
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"math/rand"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

type App struct {
	ctx context.Context
}

var (
	ApplicationContext context.Context
)

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	ApplicationContext = ctx

	runtime.WindowCenter(ctx)
}

func (a *App) domready(ctx context.Context) {
	runtime.WindowShow(ctx)
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

	err = TestConnection()
	if err != nil {
		return err
	}

	return nil
}

func (a *App) OpenDirectoryDialog(defaultDirectory string) (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{DefaultDirectory: defaultDirectory, Title: "Выберите папку"})
}

func (a *App) GetOptionalFiles(profile GameProfile) ([]OptionalFileEntry, error) {
	manifest, err := loadManifest(profile.Manifest.URL)
	if err != nil {
		return []OptionalFileEntry{}, fmt.Errorf("Ошибка загрузки манифеста: ", err)
	}
	return manifest.OptionalFiles, nil
}

func (a *App) Play(profile GameProfile) error {
	profileID := int(profile.Id)

	fs := NewFS()
	clientDirectory, err := fs.GetGameProfilePath(profileID)
	if err != nil {
		return err
	}

	err = CheckAndFixClientFiles(clientDirectory, profile)
	if err != nil {
		return err
	}

	//fmt.Println(clientDirectory, manifestUrl)
	//
	//runtime.EventsEmit(ApplicationContext, "setProgress", map[string]any{
	//	"total":  123,
	//	"done":   1234,
	//	"status": 0,
	//	"error":  nil,
	//})
	return nil
}

func (a *App) StartGame(profileID int, accessToken string) error {
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

	runtimeExecutablePath := filepath.Join("runtime", "java-runtime-gamma", "bin", "java.exe")
	nativesPath := filepath.Join(gameClientConfig.Path, "natives")

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

	closeGameEventCancel := runtime.EventsOnce(a.ctx, "closeGame", func(optionalData ...interface{}) {
		cancel()
	})
	defer closeGameEventCancel()

	cmd := exec.CommandContext(cancelCtx, strings.ReplaceAll(commandRaw[0], "{executablePath}", runtimeExecutablePath), command...)
	cmd.Dir = gameClientConfig.Path
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	runtime.EventsEmit(a.ctx, "gameStarted")

	return cmd.Run()
}

func (a *App) StartGameWithoutAccount(profileID int) error {
	commandRaw, err := RetrieveRunCommand(profileID)
	if err != nil {
		return err
	}

	fs := NewFS()
	gameClientConfig, err := fs.ReadGameProfileConfig(profileID)
	if err != nil {
		return err
	}

	runtimeExecutablePath := filepath.Join("runtime", "java-runtime-gamma", "bin", "java.exe")
	nativesPath := filepath.Join(gameClientConfig.Path, "natives")

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

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	closeGameEventCancel := runtime.EventsOnce(a.ctx, "closeGame", func(optionalData ...interface{}) {
		cancel()
	})
	defer closeGameEventCancel()

	cmd := exec.CommandContext(ctx, strings.ReplaceAll(commandRaw[0], "{executablePath}", runtimeExecutablePath), command...)

	cmd.Dir = gameClientConfig.Path

	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	runtime.EventsEmit(a.ctx, "gameStarted")

	return cmd.Run()
}

func (a *App) CheckForUpdates() (bool, error) {
	return CheckForUpdates()
}

func (a *App) Update() error {
	return Update()
}

func (a *App) RestartApp() error {
	return RestartApp()
}

func (a *App) GetVersion() string {
	return GetLauncherVersion()
}
