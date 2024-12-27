package main

import "github.com/tidwall/gjson"

const BaseUrl = "https://api.infinityserver.ru"
const S3StorageBaseUrl = "https://storage.infinityserver.ru"

const ActualLauncherBinaryUrl = "https://github.com/nomfodm/InfinityLauncher/releases/latest/download/InfinityLauncher.exe"

func GetLauncherVersion() string {
	version := gjson.Get(wailsJSON, "info.productVersion")
	return version.String()
}
