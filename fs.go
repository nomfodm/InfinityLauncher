package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
)

type FS struct{}

type LauncherConfig struct {
	CloseOnGameStart bool `json:"closeOnGameStart"`
}

type GameProfileConfig struct {
	Ram  int64  `json:"ram"`
	Path string `json:"path"`
}

var (
	AppFolderPath = path.Join(GetSystemSpecificAppdataFolder(), ".infinity")
	AppConfigPath = path.Join(AppFolderPath, "config.json")

	GameProfilesConfigFolderPath = path.Join(AppFolderPath, "profiles")
)

func GetSystemSpecificAppdataFolder() string {
	systemType := GetSystemType()
	switch systemType {
	case "linux":
		return os.Getenv("HOME")
	default:
		return os.Getenv("APPDATA")
	}
}

func NewFS() *FS {
	return &FS{}
}

func (fs *FS) InitFS() error {
	err := os.MkdirAll(GameProfilesConfigFolderPath, os.ModePerm) // nested %appdata%/.infinity/profiles
	if err != nil {
		return err
	}

	return fs.initConfig()
}

func (fs *FS) initConfig() error {
	if LauncherConfigFileExists() {
		config, err := fs.ReadLauncherConfig()
		if err != nil {
			return err
		}

		return fs.WriteLauncherConfig(config)
	}

	defaultConfig := *GenerateDefaultLauncherConfig()
	return fs.WriteLauncherConfig(defaultConfig)
}

func GenerateDefaultLauncherConfig() *LauncherConfig {
	return &LauncherConfig{
		CloseOnGameStart: false,
	}
}

func (fs *FS) WriteLauncherConfig(newConfig LauncherConfig) error {
	return WriteJSONToFile(AppConfigPath, newConfig)
}

func (fs *FS) ReadLauncherConfig() (LauncherConfig, error) {
	return ReadJSONFromFile[LauncherConfig](AppConfigPath)
}

func LauncherConfigFileExists() bool {
	if _, err := os.Stat(AppConfigPath); os.IsNotExist(err) {
		return false
	}
	return true
}

func (fs *FS) InitGameProfileConfig(id int, profileName string) error {
	if GameProfileConfigFileExists(id) {
		config, err := fs.ReadGameProfileConfig(id)
		if err != nil {
			return err
		}

		return fs.WriteGameProfileConfig(id, config)
	}

	gameProfileClientFolderPath := GetGameProfileFolderPath(profileName)

	defaultConfig := GenerateDefaultGameProfileConfig(gameProfileClientFolderPath)
	return fs.WriteGameProfileConfig(id, defaultConfig)
}

func GenerateDefaultGameProfileConfig(gameProfileClientFolderPath string) GameProfileConfig {
	return GameProfileConfig{Path: gameProfileClientFolderPath, Ram: 1024}
}

func GameProfileConfigFileExists(id int) bool {
	configPath := GetGameProfileConfigPath(id)
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return false
	}
	return true
}

func (fs *FS) WriteGameProfileConfig(id int, newConfig GameProfileConfig) error {
	configPath := GetGameProfileConfigPath(id)
	return WriteJSONToFile(configPath, newConfig)
}

func (fs *FS) ReadGameProfileConfig(id int) (GameProfileConfig, error) {
	configPath := GetGameProfileConfigPath(id)
	return ReadJSONFromFile[GameProfileConfig](configPath)
}

func GetGameProfileConfigPath(id int) string {
	return path.Join(GameProfilesConfigFolderPath, fmt.Sprintf("%d.json", id))
}

func GetGameProfileFolderPath(profileName string) string {
	return path.Join(AppFolderPath, profileName)
}

func (fs *FS) GetGameProfilePath(id int) (string, error) {
	config, err := fs.ReadGameProfileConfig(id)
	if err != nil {
		return "", err
	}

	return config.Path, nil
}

func (fs *FS) MkDirAll(path string) error {
	return os.MkdirAll(path, os.ModePerm)
}

func WriteJSONToFile(filepath string, data any) error {
	marshalledConfig, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath, marshalledConfig, 0644)
}

func ReadJSONFromFile[T any](filepath string) (T, error) {
	var unmarshalledData T

	data, err := os.ReadFile(filepath)
	if err != nil {
		return unmarshalledData, err
	}

	err = json.Unmarshal(data, &unmarshalledData)
	return unmarshalledData, err
}
