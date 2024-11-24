package main

import (
	"github.com/google/uuid"
	"time"
)

type Auth struct{}

func NewAuth() *Auth {
	return &Auth{}
}

type User struct {
	ID           uint      `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	Active       bool      `json:"active"`
	RegisteredAt time.Time `json:"registeredAt"`

	Textures            Textures            `json:"textures"`
	MinecraftCredential MinecraftCredential `json:"minecraftCredential"`
}

type Textures struct {
	SkinHash *string `json:"skinHash"`
	CapeHash *string `json:"capeHash"`
}

type MinecraftCredential struct {
	Username string    `json:"username"`
	UUID     uuid.UUID `json:"uuid"`
}

func (a *Auth) HadSession() bool {
	return Exists("refresh")
}

func (a *Auth) Login(username, password string) (string, error) {
	accessToken, refreshToken, err := RequestLogin(username, password)

	if err != nil {
		return "", err
	}

	return accessToken, Set("refresh", refreshToken)
}

func (a *Auth) Logout() error {
	refreshToken, err := Get("refresh")
	if err != nil {
		return err
	}
	_, err = RequestLogout(refreshToken)
	if err != nil {
		return err
	}

	return Delete("refresh")
}

func (a *Auth) Refresh() (string, error) {
	refreshToken, err := Get("refresh")
	if err != nil {
		return "", err
	}

	err = Delete("refresh")
	if err != nil {
		return "", err
	}

	accessToken, refreshToken, err := RequestRefresh(refreshToken)
	if err != nil {
		return "", err
	}

	return accessToken, Set("refresh", refreshToken)
}

func (a *Auth) Me(accessToken string) (User, error) {
	return RequestMe(accessToken)
}
