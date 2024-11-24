package main

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type GameFileInfo struct {
	Filename string `json:"filename"`
	SHA256   string `json:"sha256"`
}

func CalculateFilesSHA256Hash(ctx context.Context, files []string) (string, []GameFileInfo, error) {
	dirHash := sha256.New()
	files = append([]string(nil), files...)
	sort.Strings(files)
	var filesInDirHashes []GameFileInfo
	for _, filePath := range files {
		if strings.Contains(filePath, "\n") {
			return "", filesInDirHashes, errors.New("dirhash: filenames with newlines are not supported")
		}
		file, err := os.Open(filePath)
		if err != nil {
			return "", filesInDirHashes, err
		}
		currentFileHash := sha256.New()
		_, err = io.Copy(currentFileHash, file)
		file.Close()
		if err != nil {
			return "", filesInDirHashes, err
		}
		filename := filepath.Base(filePath)
		runtime.EventsEmit(ctx, "setFilenameOfCurrentFile", Dict{"filename": filename})
		fmt.Fprintf(dirHash, "%x  %s\n", currentFileHash.Sum(nil), filename)
		filesInDirHashes = append(filesInDirHashes, GameFileInfo{Filename: filePath, SHA256: fmt.Sprintf("%x", currentFileHash.Sum(nil))})
	}
	return fmt.Sprintf("%x", dirHash.Sum(nil)), filesInDirHashes, nil
}

func HashDir(ctx context.Context, dir, prefix string) (string, []GameFileInfo, error) {
	files, err := DirFiles(dir, prefix)
	if err != nil {
		return "", []GameFileInfo{}, err
	}
	return CalculateFilesSHA256Hash(ctx, files)
}

func DirFiles(dir, prefix string) ([]string, error) {
	var files []string
	dir = filepath.Clean(dir)
	err := filepath.Walk(dir, func(filename string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		rel := filename
		if dir != "." {
			rel = filename[len(dir)+1:]
		}
		f := filepath.Join(prefix, rel)
		files = append(files, filepath.ToSlash(f))
		return nil
	})
	if err != nil {
		return nil, err
	}
	return files, nil
}
