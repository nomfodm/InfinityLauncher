package main

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"sync"
)

type GameFileInfo struct {
	Filename string `json:"filename"`
	SHA256   string `json:"sha256"`
}

func calculateFileHash(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}

	filename := filepath.Base(filePath)
	hasher.Write([]byte(filename))

	return hex.EncodeToString(hasher.Sum(nil)), nil
}

func HashDir(directory string) (string, []GameFileInfo, error) {
	var fileHashes []GameFileInfo
	var wg sync.WaitGroup
	var mu sync.Mutex
	fileChan := make(chan string, 100)
	errorChan := make(chan error, 1)

	worker := func() {
		for file := range fileChan {
			hash, err := calculateFileHash(file)
			if err != nil {
				errorChan <- err
				continue
			}

			relativePath, _ := filepath.Rel(directory, file)
			mu.Lock()

			fileHashes = append(fileHashes, GameFileInfo{
				Filename: path.Join(directory, relativePath),
				SHA256:   hash,
			})

			mu.Unlock()
		}
		wg.Done()
	}

	numWorkers := 128
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go worker()
	}

	go func() {
		defer close(fileChan)
		err := filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if info.IsDir() {
				return nil
			}

			fileChan <- path
			return nil
		})
		if err != nil {
			errorChan <- err
		}
	}()

	wg.Wait()
	close(errorChan)

	if err, ok := <-errorChan; ok {
		return "", nil, err
	}

	sort.Slice(fileHashes, func(i, j int) bool {
		return fileHashes[i].Filename < fileHashes[j].Filename
	})

	dirHasher := sha256.New()
	for _, fh := range fileHashes {
		dirHasher.Write([]byte(fh.SHA256))
	}
	dirHash := hex.EncodeToString(dirHasher.Sum(nil))

	return dirHash, fileHashes, nil
}
