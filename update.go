package main

import (
	"bytes"
	"crypto"
	"encoding/hex"
	"errors"
	semver "github.com/hashicorp/go-version"
	"github.com/minio/selfupdate"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

var (
	ErrUpdateExeDoesNotExists = errors.New("update exe does not exists")
	ErrCantCheckUpdate        = errors.New("cant check update")
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

		hash, err := hex.DecodeString(actualLauncherVersion.SHA256)
		if err != nil {
			return err
		}

		err = selfupdate.Apply(bytes.NewReader(binaryData), selfupdate.Options{
			Hash:        crypto.SHA256,
			Checksum:    hash,
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
		return actualLauncherVersion, ErrCantCheckUpdate
	}
	return actualLauncherVersion, nil
}

func GetLastMandatoryLauncherVersion() (LauncherVersion, error) {
	lastMandatoryLauncherVersion, err := RequestLastMandatoryLauncherVersion()
	if err != nil {
		return lastMandatoryLauncherVersion, ErrCantCheckUpdate
	}
	return lastMandatoryLauncherVersion, nil
}

func IsAnyUpdateAvailable() (bool, error) {
	actualLauncherVersion, err := GetActualLauncherVersion()
	if err != nil {
		return false, ErrCantCheckUpdate
	}
	currentVersion, err := GetCurrentVersion()

	return !IsVersion(actualLauncherVersion, currentVersion), nil
}

func IsVersionBeforeVersion(version1, version2 LauncherVersion) (bool, error) {
	v1, err := semver.NewSemver(version1.Version)
	if err != nil {
		return false, err
	}
	v2, err := semver.NewSemver(version2.Version)
	if err != nil {
		return false, err
	}

	return v1.LessThan(v2), nil
}

func IsMandatoryUpdateAvailable() (bool, error) {
	actualLauncherVersion, err := GetActualLauncherVersion()
	if err != nil {
		return false, err
	}

	lastMandatoryVersion, err := GetLastMandatoryLauncherVersion()
	if err != nil {
		return false, err
	}

	currentVersion, err := GetCurrentVersion()

	if IsVersion(actualLauncherVersion, lastMandatoryVersion) {
		return !IsVersion(actualLauncherVersion, currentVersion), nil
	}

	beforeMandatory, err := IsVersionBeforeVersion(currentVersion, lastMandatoryVersion)
	if err != nil {
		return false, err
	}

	if beforeMandatory {
		actualLauncherVersion.Mandatory = true
	}

	afterLast, err := IsVersionBeforeVersion(actualLauncherVersion, currentVersion)
	if err != nil {
		return false, err
	}

	if afterLast {
		actualLauncherVersion.Mandatory = true
	}

	if !actualLauncherVersion.Mandatory {
		return false, nil
	}

	return !IsVersion(actualLauncherVersion, currentVersion), nil
}

func GetCurrentVersion() (LauncherVersion, error) {
	currentSHA256, err := SHA256OfExecutable()
	if err != nil {
		return LauncherVersion{}, err
	}
	currentVersion := GetLauncherVersion()

	return LauncherVersion{Version: currentVersion, SHA256: currentSHA256}, nil
}

func IsVersion(version1, version2 LauncherVersion) bool {
	if version1.Version != version2.Version || version1.SHA256 != version2.SHA256 {
		return false
	}
	return true
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
