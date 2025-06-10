package main

import "github.com/tidwall/gjson"

const BaseUrl = "https://api.infinityserver.ru"
const S3StorageBaseUrl = "https://storage.infinityserver.ru"

func GetLauncherVersion() string {
	version := gjson.Get(wailsJSON, "info.productVersion")
	return version.String()
}
