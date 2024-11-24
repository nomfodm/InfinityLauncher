package main

import (
	"embed"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	app := NewApp()
	auth := NewAuth()
	fs := NewFS()
	gameProfiler := NewGameProfiler()
	system := NewSystem()

	err := wails.Run(&options.App{
		Title:         "Лаунчер Infinity",
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
	})

	if err != nil {
		println("Error:", err.Error())
	}

	//accessTokenMain := ""
	//if !auth.HadSession() {
	//	accessToken, err := auth.Login("nomfodm", "123456")
	//	if err != nil {
	//		panic(err)
	//	}
	//	fmt.Println("authed", accessToken)
	//
	//	accessTokenMain = accessToken
	//
	//	time.Sleep(time.Second)
	//} else {
	//	accessToken, err := auth.Refresh()
	//	if err != nil {
	//		panic(err)
	//	}
	//	fmt.Println("refreshed", accessToken)
	//
	//	accessTokenMain = accessToken
	//
	//	time.Sleep(time.Second)
	//}
	//
	//user, err := auth.Me(accessTokenMain)
	//if err != nil {
	//	panic(err)
	//}
	//
	//fmt.Println(user)
	//
	//err = auth.Logout()
	//if err != nil {
	//	panic(err)
	//}

}
