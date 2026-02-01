package main

import (
	"embed"
	"fmt"
	"path/filepath"

	"github.com/tidwall/gjson"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed wails.json
var wailsJSON string

func main() {
	version := gjson.Get(wailsJSON, "info.productVersion")

	app := NewApp()
	auth := NewAuth()
	fs := NewFS()
	gameProfiler := NewGameProfiler()
	system := NewSystem()

	err := wails.Run(&options.App{
		Title:         fmt.Sprintf("Лаунчер Infinity %s", version),
		Width:         700,
		Height:        400,
		DisableResize: true,
		StartHidden:   true,
		Frameless:     true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.startup,
		OnDomReady: app.domready,
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
			auth,
			fs,
			gameProfiler,
			system,
		},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "26d0c944-b842-4218-af16-bcf99d51b6ef",
			OnSecondInstanceLaunch: app.onSecondInstanceLaunch,
		},
		Windows: &windows.Options{
			WebviewUserDataPath: filepath.Join(AppFolderPath, "webview"),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
