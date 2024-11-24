package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path"
)

type FS struct{}

type Config struct {
	CloseOnGameStart bool `json:"closeOnGameStart"`
}

type GameProfileConfig struct {
	Ram  int64  `json:"ram"`
	Path string `json:"path"`
}

var (
	AppFolderPath = path.Join(os.Getenv("APPDATA"), ".infinity")
	AppConfigPath = path.Join(AppFolderPath, "config.json")

	GameProfilesConfigFolderPath = path.Join(AppFolderPath, "profiles")
)

func NewFS() *FS {
	return &FS{}
}

func (fs *FS) InitFS() error {
	err := os.MkdirAll(AppFolderPath, os.ModePerm)
	if err != nil {
		return err
	}

	return fs.initConfig()
}

func (fs *FS) initConfig() error {
	_, err := os.Open(AppConfigPath)
	if !errors.Is(err, os.ErrNotExist) {
		return nil
	}

	defaultConfig := Config{CloseOnGameStart: true}
	marshalledConfig, err := json.Marshal(defaultConfig)
	if err != nil {
		return err
	}

	return os.WriteFile(AppConfigPath, marshalledConfig, 0644)
}

func (fs *FS) WriteConfig(newConfig Config) error {
	marshalledConfig, err := json.Marshal(newConfig)
	if err != nil {
		return err
	}

	return os.WriteFile(AppConfigPath, marshalledConfig, 0644)
}

func (fs *FS) ReadConfig() (Config, error) {
	rawConfig, err := os.ReadFile(AppConfigPath)
	if err != nil {
		return Config{}, err
	}

	var unmarshalledConfig Config
	err = json.Unmarshal(rawConfig, &unmarshalledConfig)

	return unmarshalledConfig, err
}

func (fs *FS) InitGameProfileConfig(id int, profileName string) error {
	gameProfileClientFolderPath := path.Join(AppFolderPath, profileName)
	err := os.MkdirAll(GameProfilesConfigFolderPath, os.ModePerm)
	if err != nil {
		fmt.Println(1)
		return err
	}
	configPath := path.Join(GameProfilesConfigFolderPath, fmt.Sprintf("%d.json", id))
	_, err = os.Open(configPath)
	if !errors.Is(err, os.ErrNotExist) {
		return nil
	}

	err = os.MkdirAll(gameProfileClientFolderPath, os.ModePerm)
	if err != nil {
		return err
	}

	defaultConfig := GameProfileConfig{Path: gameProfileClientFolderPath, Ram: 1024}
	marshalledConfig, err := json.Marshal(defaultConfig)
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, marshalledConfig, 0644)
}

func (fs *FS) WriteGameProfileConfig(id int, newConfig GameProfileConfig) error {
	configPath := path.Join(GameProfilesConfigFolderPath, fmt.Sprintf("%d.json", id))
	marshalledConfig, err := json.Marshal(newConfig)
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, marshalledConfig, 0644)
}

func (fs *FS) ReadGameProfileConfig(id int) (GameProfileConfig, error) {
	configPath := path.Join(GameProfilesConfigFolderPath, fmt.Sprintf("%d.json", id))
	rawConfig, err := os.ReadFile(configPath)
	if err != nil {
		return GameProfileConfig{}, err
	}

	var unmarshalledConfig GameProfileConfig
	err = json.Unmarshal(rawConfig, &unmarshalledConfig)

	return unmarshalledConfig, err
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
