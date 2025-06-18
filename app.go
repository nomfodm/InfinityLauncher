package main

import (
	"C"
	"context"
	"errors"
	"fmt"
	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/options"
	wails_runtime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/sync/errgroup"
	"log"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
)

type App struct {
	ctx context.Context
}

var (
	ApplicationContext *context.Context
)

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	ApplicationContext = &ctx

	wails_runtime.WindowCenter(ctx)
}

func (a *App) domready(ctx context.Context) {
	wails_runtime.WindowShow(ctx)
}

func (a *App) Init() error {
	err := CheckSystem()
	if err != nil {
		return err
	}

	err = cleanup()
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

func cleanup() error {
	executable, err := os.Executable()
	if err != nil {
		return err
	}
	executablePath, err := filepath.EvalSymlinks(executable)
	if err != nil {
		return err
	}

	executableDir := filepath.Dir(executablePath)
	executableName := filepath.Base(executablePath)
	newExecutablePath := filepath.Join(executableDir, "."+executableName+".new")

	_, err = os.Stat(newExecutablePath)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}

	return os.Remove(newExecutablePath)
}

func (a *App) OpenDirectoryDialog(defaultDirectory string) (string, error) {
	return wails_runtime.OpenDirectoryDialog(a.ctx, wails_runtime.OpenDialogOptions{DefaultDirectory: defaultDirectory, Title: "Выберите папку"})
}

func (a *App) OpenDirectoryInExplorer(path string) error {
	cmd := "open"
	if runtime.GOOS == "windows" {
		cmd = "explorer"
	}
	return exec.Command(cmd, path).Start()
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

	return nil
}

func (a *App) onSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	secondInstanceArgs := secondInstanceData.Args

	println("user opened second instance", strings.Join(secondInstanceData.Args, ","))
	println("user opened second from", secondInstanceData.WorkingDirectory)
	wails_runtime.WindowUnminimise(*ApplicationContext)
	wails_runtime.Show(*ApplicationContext)
	go wails_runtime.EventsEmit(*ApplicationContext, "launchArgs", secondInstanceArgs)
}

func (a *App) StartGame(profile GameProfile, accessToken string) error {
	profileID := int(profile.Id)

	cancelCtx, cancel := context.WithCancel(context.Background())
	defer cancel()

	fs := NewFS()
	gameClientConfig, err := fs.ReadGameProfileConfig(profileID)
	if err != nil {
		return err
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()

	errs, _ := errgroup.WithContext(cancelCtx)

	errs.Go(func() error {
		for {
			select {
			case <-cancelCtx.Done():
				return nil
			case event, _ := <-watcher.Events:
				cancel()
				return fmt.Errorf("modified file: %s", event.Name)
			case err, _ := <-watcher.Errors:
				cancel()
				return fmt.Errorf("error: %w", err)
			}
		}
	})

	manifest, err := loadManifest(profile.Manifest.URL)
	if err != nil {
		return err
	}
	for _, folder := range manifest.HardCheckingFolders {
		folderPath := filepath.Join(gameClientConfig.Path, folder)
		err = watcher.Add(folderPath)
		if err != nil {
			return err
		}
	}

	commandRaw, err := RetrieveRunCommand(profileID)
	if err != nil {
		return err
	}

	minecraftData, err := RequestMinecraftUserData(accessToken)
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

	closeGameEventCancel := wails_runtime.EventsOnce(a.ctx, "closeGame", func(optionalData ...interface{}) {
		cancel()
	})
	defer closeGameEventCancel()

	cmd := exec.CommandContext(cancelCtx, strings.ReplaceAll(commandRaw[0], "{executablePath}", runtimeExecutablePath), command...)
	cmd.Dir = gameClientConfig.Path
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	wails_runtime.EventsEmit(a.ctx, "gameStarted")

	errs.Go(cmd.Run)

	return errs.Wait()
}

func (a *App) StartGameWithoutAccount(profile GameProfile) error {
	profileID := int(profile.Id)
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

	closeGameEventCancel := wails_runtime.EventsOnce(a.ctx, "closeGame", func(optionalData ...interface{}) {
		cancel()
	})
	defer closeGameEventCancel()

	cmd := exec.CommandContext(ctx, strings.ReplaceAll(commandRaw[0], "{executablePath}", runtimeExecutablePath), command...)

	cmd.Dir = gameClientConfig.Path

	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	wails_runtime.EventsEmit(a.ctx, "gameStarted")

	return cmd.Run()
}

func (a *App) IsMandatoryUpdateAvailable() (bool, error) {
	return IsMandatoryUpdateAvailable()
}

func (a *App) IsAnyUpdateAvailable() (bool, error) {
	return IsAnyUpdateAvailable()
}

func (a *App) GetActualLauncherVersion() (LauncherVersion, error) {
	return GetActualLauncherVersion()
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
