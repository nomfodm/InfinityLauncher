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
	"path"
	"path/filepath"
)

func Update() error {
	resp, err := http.Get("https://storage.infinityserver.ru/InfinityLauncher.exe")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	binaryData, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	isUpdatesFound := CheckForUpdates(binaryData)
	if errors.Is(isUpdatesFound, updateFound) {
		hash := sha256.New()
		if _, err := io.Copy(hash, bytes.NewReader(binaryData)); err != nil {
			return err
		}

		err = selfupdate.Apply(bytes.NewReader(binaryData), selfupdate.Options{
			Hash:        crypto.SHA256,
			Checksum:    hash.Sum(nil),
			OldSavePath: path.Join(AppFolderPath, ".infinity.old"),
		})

		if err != nil {
			if rerr := selfupdate.RollbackError(err); rerr != nil {
				fmt.Printf("Failed to rollback from bad update: %v\n", rerr)
			}
		}
		return nil
	}

	return isUpdatesFound
}

func CheckForUpdates(onlineBinaryData []byte) error {
	if onlineBinaryData == nil {
		resp, err := http.Get("https://storage.infinityserver.ru/InfinityLauncher.exe")
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		onlineBinaryData, err = io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
	}

	executablePath, err := os.Executable()
	if err != nil {
		return err
	}

	executablePathSymlinkEvaluated, err := filepath.EvalSymlinks(executablePath)
	if err != nil {
		return err
	}

	executableFile, err := os.Open(executablePathSymlinkEvaluated)
	if err != nil {
		return err
	}

	binaryData, err := io.ReadAll(executableFile)
	if err != nil {
		return err
	}

	currentExecutableHash := sha256.New()
	if _, err = io.Copy(currentExecutableHash, bytes.NewBuffer(binaryData)); err != nil {
		return err
	}

	checksumOfCurrentExecutable := string(currentExecutableHash.Sum(nil))

	onlineExecutableHash := sha256.New()
	if _, err = io.Copy(onlineExecutableHash, bytes.NewBuffer(onlineBinaryData)); err != nil {
		return err
	}
	if checksumOfCurrentExecutable != string(onlineExecutableHash.Sum(nil)) {
		return updateFound
	}
	return nil
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