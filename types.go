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
