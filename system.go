package main

import (
	"errors"
	"github.com/shirou/gopsutil/host"
	"github.com/shirou/gopsutil/mem"
	"strconv"
	"strings"
)

type System struct{}

func NewSystem() *System {
	return &System{}
}

func CheckSystem() error {
	hostStat, _ := host.Info()
	os := hostStat.OS
	version, _ := strconv.ParseInt(strings.Split(hostStat.PlatformVersion, ".")[0], 10, 32)
	if os != "windows" || version < 10 || version > 11 {
		return errors.New("На данный момент лаунчер поддерживает только ОС Windows (10/11)")
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
