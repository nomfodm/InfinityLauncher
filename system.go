package main

import (
	"errors"
	"github.com/shirou/gopsutil/host"
	"github.com/shirou/gopsutil/mem"
)

type System struct{}

func NewSystem() *System {
	return &System{}
}

func GetSystemType() string {
	hostStat, _ := host.Info()
	return hostStat.OS
}

func CheckSystem() error {
	os := GetSystemType()
	if os != "windows" && os != "linux" {
		return errors.New("На данный момент лаунчер поддерживает только ОС Windows и Linux")
	}
	return nil
}

func (s *System) GetTotalRAMInMB() (uint64, error) {
	v, err := mem.VirtualMemory()
	if err != nil {
		return 0, err
	}
	return v.Total / 1024 / 1024, nil
}
