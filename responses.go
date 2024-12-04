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
