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
	"strconv"
	"strings"
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

func GetLastMandatoryLauncherVersion() (LauncherVersion, error) {
	lastMandatoryLauncherVersion, err := RequestLastMandatoryLauncherVersion()
	if err != nil {
		return lastMandatoryLauncherVersion, errors.New("cantcheckupdate")
	}
	return lastMandatoryLauncherVersion, nil
}

func IsAnyUpdateAvailable() (bool, error) {
	actualLauncherVersion, err := GetActualLauncherVersion()
	if err != nil {
		return false, errors.New("cantcheckupdate")
	}
	currentVersion, err := GetCurrentVersion()

	return !IsVersion(actualLauncherVersion, currentVersion), nil
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

func IsVersionBeforeVersion(version1, version2 LauncherVersion) (bool, error) {
	major1, minor1, patch1, err := ExtractVersionString(version1.Version)
	if err != nil {
		return false, err
	}
	major2, minor2, patch2, err := ExtractVersionString(version2.Version)
	if err != nil {
		return false, err
	}

	if major1 == major2 && minor1 == minor2 && patch1 == patch2 {
		return false, nil
	}

	if major1 < major2 {
		return true, nil
	}

	if minor1 < minor2 {
		return true, nil
	}

	if patch1 < patch2 {
		return true, nil
	}

	return false, nil
}

func ExtractVersionString(version string) (int, int, int, error) {
	versionSplit := strings.Split(version, ".") // v1.2.0-m
	if len(versionSplit) != 3 {
		return -1, -1, -1, errors.New("version string does not contain three parts")
	}

	majorStr := versionSplit[0][1:]
	minorStr := versionSplit[1]
	patchStr := strings.Split(versionSplit[2], "-")[0]

	major, err := strconv.Atoi(majorStr)
	if err != nil {
		return -1, -1, -1, err
	}

	minor, err := strconv.Atoi(minorStr)
	if err != nil {
		return -1, -1, -1, err
	}

	patch, err := strconv.Atoi(patchStr)
	if err != nil {
		return -1, -1, -1, err
	}

	return major, minor, patch, nil
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
