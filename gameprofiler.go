package main

import (
	"encoding/json"
	"github.com/iverly/go-mcping/api/types"
	"github.com/iverly/go-mcping/mcping"
)

type GameProfiler struct{}

func NewGameProfiler() *GameProfiler {
	return &GameProfiler{}
}

type GameProfile struct {
	Id          uint64 `json:"id"`
	Name        string `json:"name"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Version     string `json:"version"`

	CardImgUrl           string          `json:"cardImgUrl"`
	PageBackgroundImgUrl string          `json:"pageBackgroundImgUrl"`
	MinecraftServer      MinecraftServer `json:"minecraftServer"`
}

type MinecraftServer struct {
	IP   string `json:"ip"`
	Port uint16 `json:"port"`
}

func (gp GameProfiler) RetrieveGameProfiles() ([]GameProfile, error) {
	response, err := GET(S3StorageBaseUrl+"/gameprofiles.json", Dict{})
	if err != nil {
		return nil, err
	}
	var gameProfiles []GameProfile
	err = json.Unmarshal(response, &gameProfiles)
	if err != nil {
		return nil, err
	}
	return gameProfiles, nil
}

func (gp GameProfiler) PingMinecraftServer(ip string, port uint16) (*types.PingResponse, error) {
	pinger := mcping.NewPinger()
	return pinger.Ping(ip, port)
}