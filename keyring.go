package main

import (
	"github.com/zalando/go-keyring"
)

const service = "infinity"

func Get(login string) (string, error) {
	return keyring.Get(service, login)
}

func Set(login string, password string) error {
	return keyring.Set(service, login, password)
}

func Delete(login string) error {
	return keyring.Delete(service, login)
}

func Exists(login string) bool {
	_, err := Get(login)
	return err == nil
}
