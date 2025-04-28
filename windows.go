//go:build windows

package main

import "syscall"

func GameCommandSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{HideWindow: true}
}
