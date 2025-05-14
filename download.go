package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync/atomic"
)

func downloadFile(ctx context.Context, url, path string, cb ProgressCallback) error {
	var start int64
	if info, err := os.Stat(path); err == nil {
		start = info.Size()
	}
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}
	if start > 0 {
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-", start))
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		return fmt.Errorf("не удалось начать загрузку: %s", resp.Status)
	}

	return streamToFile(ctx, resp.Body, path, start, cb)
}

func streamToFile(ctx context.Context, body io.Reader, path string, offset int64, cb ProgressCallback) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	out, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	defer out.Close()
	if offset > 0 {
		out.Seek(offset, io.SeekStart)
	}
	atomic.AddInt64(&totalBytes, -offset)

	buf := make([]byte, 32*1024)
	for {
		select {
		case <-ctx.Done():
			return canceledError
		default:
		}
		n, err := body.Read(buf)
		if n > 0 {
			if wn, werr := out.Write(buf[:n]); werr != nil || wn != n {
				return fmt.Errorf("ошибка записи: %v", werr)
			}
			atomic.AddInt64(&doneBytes, int64(n))
			cb(atomic.LoadInt64(&totalBytes), atomic.LoadInt64(&doneBytes), downloadingStatus, nil)
		}
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
	}
	return nil
}
