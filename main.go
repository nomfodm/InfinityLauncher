package main

import (
	"embed"
	"fmt"
	"github.com/tidwall/gjson"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"path"
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
		Width:         800,
		Height:        500,
		DisableResize: true,
		StartHidden:   true,
		Frameless:     true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.startup,
		OnDomReady: app.domready,
		Bind: []interface{}{
			app,
			auth,
			fs,
			gameProfiler,
			system,
		},
		Windows: &windows.Options{
			WebviewUserDataPath: path.Join(AppFolderPath, "webview"),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
