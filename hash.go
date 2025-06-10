package main

import (
	"bytes"
	"crypto/md5"
	"crypto/sha256"
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

func SHA256OfExecutable() (string, error) {
	executablePath, err := os.Executable()
	if err != nil {
		return "", err
	}

	executableFile, err := os.Open(executablePath)
	if err != nil {
		return "", err
	}

	binaryData, err := io.ReadAll(executableFile)
	if err != nil {
		return "", err
	}

	currentExecutableHash := sha256.New()
	if _, err = io.Copy(currentExecutableHash, bytes.NewBuffer(binaryData)); err != nil {
		return "", err
	}

	return hex.EncodeToString(currentExecutableHash.Sum(nil)), nil
}
