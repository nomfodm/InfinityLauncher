package main

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"io"
	fs_ "io/fs"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"
)

type ProgressCallback func(total, done int64, status uint, err error)

var (
	cacheMutex sync.Mutex
	md5Cache   = make(map[string]cacheEntry)
	cacheFile  = "cache.json"

	totalBytes int64
	doneBytes  int64

	canceledError = fmt.Errorf("canceled")
)

const (
	fetchingStatus    = 0
	downloadingStatus = 1
	preparingStatus   = 2
	successStatus     = 3
	errorStatus       = 4
	canceledStatus    = 5
)

func CheckAndFixClientFiles(clientDirectory string, gameProfile GameProfile) error {
	cacheFile = filepath.Join(clientDirectory, "cache.json")

	os.MkdirAll(clientDirectory, os.ModePerm)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	callback := func(total, done int64, status uint, err error) {
		if err != nil {
			runtime.EventsEmit(ApplicationContext, "setProgress", map[string]any{
				"total":  total,
				"done":   done,
				"status": status,
				"error":  err.Error(),
			})
			return
		}
		runtime.EventsEmit(ApplicationContext, "setProgress", map[string]any{
			"total":  total,
			"done":   done,
			"status": status,
			"error":  nil,
		})
	}
	throttledCallback := makeThrottledProgress(callback, 300*time.Millisecond)

	cancelEventCancel := runtime.EventsOnce(ApplicationContext, "cancel", func(optionalData ...interface{}) {
		cancel()
	})
	defer cancelEventCancel()

	callback(-1, -1, fetchingStatus, nil)

	loadCache()

	manifestUrl := gameProfile.Manifest.URL
	manifest, err := loadManifest(manifestUrl)
	if err != nil {
		return fmt.Errorf("Ошибка загрузки манифеста: ", err)
	}

	fs := NewFS()
	config, err := fs.ReadGameProfileConfig(int(gameProfile.Id))
	if err != nil {
		return fmt.Errorf("Ошибка чтения конфига профиля: ", err)
	}

	selectedOptionalFiles := config.OptionalFilesEnabled
	for entry, enabled := range selectedOptionalFiles {
		if enabled {
			for _, optionalFile := range manifest.OptionalFiles {
				if entry == optionalFile.MD5 {
					fileEntry := FileEntry{
						URL:  optionalFile.URL,
						Path: optionalFile.Path,
						MD5:  optionalFile.MD5,
						Size: optionalFile.Size,
					}
					manifest.Required = append(manifest.Required, fileEntry)

					break
				}
			}
		}
	}

	if err := cleanupExtraFiles(manifest.Required, manifest.HardCheckingFolders, clientDirectory); err != nil {
		return fmt.Errorf("Ошибка очистки лишних файлов: ", err)
	}

	var requiredFilesToProcess []FileEntry
	totalBytes = 0
	doneBytes = 0
	for _, entry := range manifest.Required {
		path1 := filepath.Join(clientDirectory, entry.Path)
		if pathExists(path1) {
			if ok, err := checkCachedMD5(path1, entry.MD5); err == nil && ok {
				continue
			}
		}

		atomic.AddInt64(&totalBytes, entry.Size)

		entry.Path = path1

		requiredFilesToProcess = append(requiredFilesToProcess, entry)
	}

	var foldersToDownloadAndExtract []NonStrictVerifiableFolderEntry
	for _, entry := range manifest.NonStrictVerifiableFolders {
		path1 := filepath.Join(clientDirectory, entry.Path)
		entry.Download.Destination = filepath.Join(clientDirectory, entry.Download.Destination)
		entry.Path = path1
		if pathExists(path1) {
			md5file, err := os.Open(filepath.Join(path1, ".md5"))
			if os.IsNotExist(err) {
				atomic.AddInt64(&totalBytes, entry.Download.Size)
				foldersToDownloadAndExtract = append(foldersToDownloadAndExtract, entry)
				continue
			}
			if err != nil {
				return err
			}
			md5bytes, err := io.ReadAll(md5file)
			if err != nil {
				return err
			}
			md5 := string(md5bytes)

			md5file.Close()

			if entry.MD5 == md5 {
				continue
			}
		}

		atomic.AddInt64(&totalBytes, entry.Download.Size)

		foldersToDownloadAndExtract = append(foldersToDownloadAndExtract, entry)
	}

	var nonVerifiableFilesToDownload []FileEntry
	for _, entry := range manifest.NonVerifiable {
		path1 := filepath.Join(clientDirectory, entry.Path)
		if pathExists(path1) {
			continue
		}

		atomic.AddInt64(&totalBytes, entry.Size)

		entry.Path = path1

		nonVerifiableFilesToDownload = append(nonVerifiableFilesToDownload, entry)
	}

	const concurrencyLimit = 4
	sem := make(chan struct{}, concurrencyLimit)
	var wg sync.WaitGroup

	for _, entry := range nonVerifiableFilesToDownload {
		select {
		case <-ctx.Done():
			callback(0, 0, canceledStatus, nil)
			return canceledError
		default:
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(e FileEntry) {
			defer wg.Done()
			defer func() { <-sem }()
			if err := downloadFile(ctx, e.URL, e.Path, throttledCallback); err != nil {
				callback(0, 0, errorStatus, err)
			}
		}(entry)
	}
	wg.Wait()

	for _, entry := range requiredFilesToProcess {
		select {
		case <-ctx.Done():
			callback(0, 0, canceledStatus, nil)
			return canceledError
		default:
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(e FileEntry) {
			defer wg.Done()
			defer func() { <-sem }()
			if err := processRequiredFile(ctx, e, throttledCallback, callback); err != nil {
				callback(0, 0, errorStatus, err)
			}
		}(entry)
	}
	wg.Wait()

	for _, entry := range foldersToDownloadAndExtract {
		select {
		case <-ctx.Done():
			callback(0, 0, canceledStatus, nil)
			return canceledError
		default:
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(e NonStrictVerifiableFolderEntry) {
			defer wg.Done()
			defer func() { <-sem }()
			if err := downloadAndExtractNonStrictFolder(ctx, e, throttledCallback, callback); err != nil {
				callback(0, 0, errorStatus, err)
			}
		}(entry)
	}
	wg.Wait()

	saveCache()
	if ctx.Err() != nil {
		callback(0, 0, canceledStatus, nil)
		fmt.Println("Загрузка отменена.")
	} else {
		callback(atomic.LoadInt64(&totalBytes), atomic.LoadInt64(&doneBytes), successStatus, nil)
		fmt.Println("Все файлы загружены, проверены и синхронизированы.")
	}

	return nil
}

func makeThrottledProgress(cb ProgressCallback, minInterval time.Duration) ProgressCallback {
	var last time.Time
	var mu sync.Mutex

	return func(total, done int64, status uint, err error) {
		mu.Lock()
		defer mu.Unlock()
		now := time.Now()
		if now.Sub(last) < minInterval {
			return
		}
		last = now
		cb(total, done, status, err)
	}
}

func loadManifest(url string) (FileManifest, error) {
	return GET[FileManifest](url, StringMap{})
}

func checkCachedMD5(path, expected string) (bool, error) {
	fi, err := os.Stat(path)
	if err != nil {
		return false, err
	}
	mtime := fi.ModTime().Unix()
	cacheMutex.Lock()
	entry, found := md5Cache[path]
	cacheMutex.Unlock()
	if found && entry.ModTime == mtime {
		return entry.MD5 == expected, nil
	}
	h, err := computeMD5(path)
	if err != nil {
		return false, err
	}
	cacheMutex.Lock()
	md5Cache[path] = cacheEntry{ModTime: mtime, MD5: h}
	cacheMutex.Unlock()
	return h == expected, nil
}

func cleanupExtraFiles(manifest []FileEntry, roots []string, clientDirectory string) error {
	allowed := make(map[string]struct{})
	for _, e := range manifest {
		path1 := filepath.Join(clientDirectory, e.Path)
		allowed[path1] = struct{}{}
	}
	for _, root := range roots {
		rootPath := filepath.Join(clientDirectory, root)

		if _, err := os.Stat(rootPath); err != nil {
			continue
		}
		err := filepath.WalkDir(rootPath, func(path string, d fs_.DirEntry, err error) error {
			if err != nil || d.IsDir() {
				return nil
			}
			if _, ok := allowed[path]; !ok {
				if rmErr := os.RemoveAll(path); rmErr != nil {
					return rmErr
				}
			}
			return nil
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func downloadAndExtractNonStrictFolder(ctx context.Context, folderEntry NonStrictVerifiableFolderEntry, cb ProgressCallback, commonCB ProgressCallback) error {
	select {
	case <-ctx.Done():
		commonCB(0, 0, canceledStatus, nil)
		return canceledError
	default:
	}

	dest := folderEntry.Download.Destination

	if ok, _ := verify(dest, folderEntry.Download.MD5); !ok {
		err := downloadFile(ctx, folderEntry.Download.Url, dest, cb)
		select {
		case <-ctx.Done():
			commonCB(0, 0, canceledStatus, nil)
			return canceledError
		default:
		}

		if ok, _ := verify(dest, folderEntry.Download.MD5); !ok || err != nil {
			os.Remove(dest)
			atomic.AddInt64(&totalBytes, folderEntry.Download.Size)

			if err := downloadFile(ctx, folderEntry.Download.Url, dest, cb); err != nil {
				return err
			}
			if ok2, _ := verify(dest, folderEntry.Download.MD5); !ok2 {
				return fmt.Errorf("файл поврежден даже после полной загрузки: %s", dest)
			}
		}

		cb(atomic.LoadInt64(&totalBytes), atomic.LoadInt64(&doneBytes), downloadingStatus, nil)
	} else {
		atomic.AddInt64(&totalBytes, -folderEntry.Download.Size)
	}

	commonCB(-1, -1, preparingStatus, nil)

	data, err := os.ReadFile(dest)
	if err != nil {
		return err
	}

	r, err := zip.NewReader(bytes.NewReader(data), folderEntry.Download.Size)
	if err != nil {
		return err
	}

	extractionPath := folderEntry.Path

	os.RemoveAll(extractionPath)
	os.MkdirAll(extractionPath, 0o755)

	clientDirectory := filepath.Dir(folderEntry.Path)

	for _, f := range r.File {
		select {
		case <-ctx.Done():
			commonCB(0, 0, canceledStatus, nil)
			return canceledError
		default:
		}
		fp := filepath.Join(clientDirectory, f.Name)
		if f.FileInfo().IsDir() {
			os.MkdirAll(fp, f.Mode())
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		os.MkdirAll(filepath.Dir(fp), 0o755)
		out, err := os.OpenFile(fp, os.O_CREATE|os.O_WRONLY, f.Mode())
		if err != nil {
			rc.Close()
			return err
		}
		io.Copy(out, rc)
		out.Close()
		rc.Close()
	}

	err = createMD5FileInNonStrictFolder(folderEntry)
	if err != nil {
		return err
	}

	return os.RemoveAll(dest)
}

func createMD5FileInNonStrictFolder(folderEntry NonStrictVerifiableFolderEntry) error {
	return os.WriteFile(filepath.Join(folderEntry.Path, ".md5"), []byte(folderEntry.MD5), 0644)
}

func processRequiredFile(ctx context.Context, entry FileEntry, cb ProgressCallback, commonCB ProgressCallback) error {
	select {
	case <-ctx.Done():
		commonCB(0, 0, canceledStatus, nil)
		return canceledError
	default:
	}

	if pathExists(entry.Path) {
		if ok, err := checkCachedMD5(entry.Path, entry.MD5); err == nil && ok {
			return nil
		}
	}

	err := downloadFile(ctx, entry.URL, entry.Path, cb)

	select {
	case <-ctx.Done():
		commonCB(0, 0, canceledStatus, nil)
		return canceledError
	default:
	}

	if ok, _ := verifyAndCache(entry.Path, entry.MD5); !ok || err != nil {
		os.Remove(entry.Path)
		atomic.AddInt64(&totalBytes, entry.Size)

		if err := downloadFile(ctx, entry.URL, entry.Path, cb); err != nil {
			return err
		}
		if ok2, _ := verifyAndCache(entry.Path, entry.MD5); !ok2 {
			return fmt.Errorf("файл поврежден даже после полной загрузки: %s", entry.Path)
		}
	}
	return nil
}

func pathExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func verifyAndCache(path, expected string) (bool, error) {
	h, err := computeMD5(path)
	if err != nil {
		return false, err
	}
	fi, _ := os.Stat(path)
	mtime := fi.ModTime().Unix()
	cacheMutex.Lock()
	md5Cache[path] = cacheEntry{ModTime: mtime, MD5: h}
	cacheMutex.Unlock()
	return h == expected, nil
}

func loadCache() {
	data, err := os.ReadFile(cacheFile)
	if err != nil {
		return
	}
	cacheMutex.Lock()
	json.Unmarshal(data, &md5Cache)
	cacheMutex.Unlock()
}

func saveCache() {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()
	data, err := json.MarshalIndent(md5Cache, "", "  ")
	if err != nil {
		return
	}
	os.WriteFile(cacheFile, data, 0o644)
}
