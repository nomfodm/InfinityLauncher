package main

import (
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"
)

func computeMD5(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := md5.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func verify(path, expected string) (bool, error) {
	h, err := computeMD5(path)
	if err != nil {
		return false, err
	}
	return h == expected, nil
}
