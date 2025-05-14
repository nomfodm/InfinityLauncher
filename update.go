package main

import (
	"bytes"
	"crypto"
	"crypto/sha256"
	"encoding/hex"
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

func RetrieveUpdateBinaryData() ([]byte, error) {
	resp, err := http.Get(ActualLauncherBinaryUrl)
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
	isUpdatesFound, err := CheckForUpdates()
	if err != nil {
		return err
	}
	if isUpdatesFound {
		binaryData, err := RetrieveUpdateBinaryData()
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

func CheckForUpdates() (bool, error) {
	launcherVersionInformation, err := RequestLauncherVersionInformation()
	if err != nil {
		return false, err
	}

	executablePath, err := os.Executable()
	if err != nil {
		return false, err
	}

	executablePathSymlinkEvaluated, err := filepath.EvalSymlinks(executablePath)
	if err != nil {
		return false, err
	}

	executableFile, err := os.Open(executablePathSymlinkEvaluated)
	if err != nil {
		return false, err
	}

	binaryData, err := io.ReadAll(executableFile)
	if err != nil {
		return false, err
	}

	currentExecutableHash := sha256.New()
	if _, err = io.Copy(currentExecutableHash, bytes.NewBuffer(binaryData)); err != nil {
		return false, err
	}

	checksumOfCurrentExecutable := hex.EncodeToString(currentExecutableHash.Sum(nil))

	if GetLauncherVersion() != launcherVersionInformation.ActualVersion || checksumOfCurrentExecutable != launcherVersionInformation.ActualHashSHA256 {
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
