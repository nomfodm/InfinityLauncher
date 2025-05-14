package main

import "time"

type StatusResponse struct {
	Status string `json:"status"`
}

type LoginResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type RefreshResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type ErrorResponse struct {
	Error  string `json:"error"`
	Detail string `json:"detail"`
}

type ConnectionTestResponse struct {
	Status     string     `json:"status"`
	ServerTime *time.Time `json:"serverTime"`
}

type MinecraftDataResponse struct {
	AccessToken string `json:"accessToken"`
	Username    string `json:"username"`
	UUID        string `json:"uuid"`
}

type LauncherVersionInformation struct {
	ActualVersion    string `json:"version"`
	ActualHashSHA256 string `json:"hash"`
}

type StringMap map[string]string

type FileManifest struct {
	Required                   []FileEntry                      `json:"required"`
	NonStrictVerifiableFolders []NonStrictVerifiableFolderEntry `json:"nonStrictVerifiableFolders"`
	HardCheckingFolders        []string                         `json:"hardCheckingFolders"`
	NonVerifiable              []FileEntry                      `json:"nonVerifiable"`
}

type NonStrictVerifiableFolderEntry struct {
	Path     string          `json:"path"`
	MD5      string          `json:"md5"`
	Download DownloadSection `json:"download"`
}

type DownloadSection struct {
	Url         string `json:"url"`
	MD5         string `json:"md5"`
	Destination string `json:"dest"`
	Size        int64  `json:"size"`
}

type FileEntry struct {
	URL  string `json:"downloadUrl"`
	Path string `json:"path"`
	MD5  string `json:"md5"`
	Size int64  `json:"size"`
}

type cacheEntry struct {
	ModTime int64  `json:"mtime"`
	MD5     string `json:"md5"`
}
