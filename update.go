package main

import (
	"bytes"
	"crypto"
	"crypto/sha256"
	"errors"
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
	isUpdatesFound, err := IsAnyUpdateAvailable()
	if err != nil {
		return err
	}
	if isUpdatesFound {
		actualLauncherVersion, err := GetActualLauncherVersion()
		if err != nil {
			return err
		}

		binaryData, err := RetrieveUpdateBinaryData(actualLauncherVersion.DownloadUrl)
		if err != nil {
			return err
		}

		hash := sha256.New()
		if _, err := io.Copy(hash, bytes.NewBuffer(binaryData)); err != nil {
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

func GetActualLauncherVersion() (LauncherVersion, error) {
	actualLauncherVersion, err := RequestActualLauncherVersion()
	if err != nil {
		return actualLauncherVersion, errors.New("cantcheckupdate")
	}
	return actualLauncherVersion, nil
}

func IsAnyUpdateAvailable() (bool, error) {
	actualLauncherVersion, err := GetActualLauncherVersion()
	if err != nil {
		return false, errors.New("cantcheckupdate")
	}

	return IsCurrentVersion(actualLauncherVersion)
}

func IsMandatoryUpdateAvailable() (bool, error) {
	actualLauncherVersion, err := GetActualLauncherVersion()
	if err != nil {
		return false, errors.New("cantcheckupdate")
	}

	if !actualLauncherVersion.Mandatory {
		return false, nil
	}

	return IsCurrentVersion(actualLauncherVersion)
}

func IsCurrentVersion(version LauncherVersion) (bool, error) {
	currentSHA256, err := SHA256OfExecutable()
	if err != nil {
		return false, err
	}
	currentVersion := GetLauncherVersion()

	if currentVersion != version.Version || currentSHA256 != version.SHA256 {
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
