package main

import (
	"bytes"
	"crypto"
	"crypto/sha256"
	"errors"
	"fmt"
	"github.com/minio/selfupdate"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

var (
	ErrUpdateExeDoesNotExists = errors.New("update exe does not exists")
)

func RetrieveUpdateBinaryData(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, ErrUpdateExeDoesNotExists
	}

	binaryData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return binaryData, nil
}

func Update() error {
	isUpdatesFound, err := IsUpdateAvailable()
	if err != nil {
		return err
	}
	if isUpdatesFound {
		actualLauncherVersion, err := RequestActualLauncherVersion()
		if err != nil {
			return errors.New("cantcheckupdate")
		}

		binaryData, err := RetrieveUpdateBinaryData(actualLauncherVersion.DownloadUrl)
		if err != nil {
			return err
		}

		hash := sha256.New()
		if _, err := io.Copy(hash, bytes.NewReader(binaryData)); err != nil {
			return err
		}

		err = selfupdate.Apply(bytes.NewReader(binaryData), selfupdate.Options{
			Hash:        crypto.SHA256,
			Checksum:    hash.Sum(nil),
			OldSavePath: filepath.Join(AppFolderPath, ".infinity.old"),
		})

		if err != nil {
			if rerr := selfupdate.RollbackError(err); rerr != nil {
				return rerr
			}
		}
	}

	return nil
}

func IsUpdateAvailable() (bool, error) {
	actualLauncherVersion, err := RequestActualLauncherVersion()
	if err != nil {
		return false, errors.New("cantcheckupdate")
	}
	currentSHA256, err := SHA256OfExecutable()
	if err != nil {
		return false, err
	}
	currentVersion := GetLauncherVersion()

	fmt.Println(currentSHA256, currentVersion)
	fmt.Println(actualLauncherVersion.SHA256, actualLauncherVersion.Version)

	if currentVersion != actualLauncherVersion.Version || currentSHA256 != actualLauncherVersion.SHA256 {
		return true, nil
	}
	return false, nil
}

func RestartApp() error {
	executable, err := os.Executable()
	if err != nil {
		return err
	}

	cmd := exec.Command(executable)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		return err
	}

	os.Exit(0)
	return nil
}
