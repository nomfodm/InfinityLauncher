package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

var (
	assetsZipUrl    = S3StorageBaseUrl + "/%d/assets.zip"
	librariesZipUrl = S3StorageBaseUrl + "/%d/libraries.zip"
	modsZipUrl      = S3StorageBaseUrl + "/%d/mods.zip"
	runtimeZipUrl   = S3StorageBaseUrl + "/%d/runtime.zip"
	versionsZipUrl  = S3StorageBaseUrl + "/%d/versions.zip"
)

type MinecraftDataResponse struct {
	AccessToken string `json:"accessToken"`
	Username    string `json:"username"`
	UUID        string `json:"uuid"`
}

type Dict map[string]string

func GET(url string, headers Dict) ([]byte, error) {
	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return []byte{}, err
	}
	for key, value := range headers {
		request.Header.Add(key, value)
	}

	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		return []byte{}, err
	}
	defer response.Body.Close()

	responseBody, _ := io.ReadAll(response.Body)
	if response.StatusCode != 200 {
		var responseBodyJsonError ErrorResponse
		err := json.Unmarshal(responseBody, &responseBodyJsonError)
		if err != nil {
			return []byte{}, err
		}
		return []byte{}, errors.New(responseBodyJsonError.Detail)
	}
	return responseBody, nil
}

func POST(url string, requestBody Dict, headers Dict) ([]byte, error) {
	requestBodyJsonString, _ := json.Marshal(requestBody)
	request, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBodyJsonString))
	if err != nil {
		return []byte{}, err
	}
	request.Header.Add("Content-Type", "application/json")
	for key, value := range headers {
		request.Header.Add(key, value)
	}

	client := &http.Client{
		Timeout: 2 * time.Second,
	}
	response, err := client.Do(request)
	if err != nil {
		return []byte{}, err
	}
	defer response.Body.Close()

	responseBody, _ := io.ReadAll(response.Body)
	if response.StatusCode != 200 {
		var responseBodyJsonError ErrorResponse
		err := json.Unmarshal(responseBody, &responseBodyJsonError)
		if err != nil {
			return []byte{}, err
		}
		return []byte{}, errors.New(responseBodyJsonError.Detail)
	}
	return responseBody, nil
}

func RequestLogin(username, password string) (string, string, error) {
	response, err := POST(BaseUrl+"/auth/signin", Dict{"username": username, "password": password}, Dict{})
	if err != nil {
		return "", "", err
	}
	var unmarshalledResponse LoginResponse
	err = json.Unmarshal(response, &unmarshalledResponse)
	return unmarshalledResponse.AccessToken, unmarshalledResponse.RefreshToken, nil
}

func RequestRefresh(refreshToken string) (string, string, error) {
	response, err := POST(BaseUrl+"/auth/refresh", Dict{"refreshToken": refreshToken}, Dict{})
	if err != nil {
		return "", "", err
	}
	var unmarshalledResponse RefreshResponse
	err = json.Unmarshal(response, &unmarshalledResponse)
	return unmarshalledResponse.AccessToken, unmarshalledResponse.RefreshToken, nil
}

func RequestLogout(refreshToken string) (string, error) {
	response, err := POST(BaseUrl+"/auth/logout", Dict{"refreshToken": refreshToken}, Dict{})
	if err != nil {
		return "", err
	}
	var unmarshalledResponse StatusResponse
	err = json.Unmarshal(response, &unmarshalledResponse)
	return unmarshalledResponse.Status, nil
}

func RequestMe(accessToken string) (User, error) {
	response, err := GET(BaseUrl+"/user/me", Dict{"Authorization": fmt.Sprintf("Bearer %s", accessToken)})
	if err != nil {
		return User{}, err
	}
	var unmarshalledResponse User
	err = json.Unmarshal(response, &unmarshalledResponse)
	return unmarshalledResponse, nil
}

func DownloadFile(cancelCtx context.Context, url string, headers Dict, filepath string, callback func(value, total int64, speed float64)) error {
	req, err := http.NewRequestWithContext(cancelCtx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("ошибка создания запроса: %v", err)
	}

	fileOnServerInfo, err := http.Head(url)
	if err != nil {
		return fmt.Errorf("ошибка создания запроса: %v", err)
	}
	defer fileOnServerInfo.Body.Close()

	out, err := os.OpenFile(filepath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("ошибка создания файла: %v", err)
	}
	defer out.Close()

	outputFileInfo, _ := out.Stat()
	if outputFileInfo.Size() > 0 {
		req.Header.Add("Range", fmt.Sprintf("bytes=%d-%d", outputFileInfo.Size(), fileOnServerInfo.ContentLength-1))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("ошибка скачивания файла: %v", err)
	}
	defer resp.Body.Close()

	buf := make([]byte, 1024)
	prPos := 0
	predPos := 0
	startTime := time.Now()

	for {
		select {
		case <-cancelCtx.Done():
			return fmt.Errorf("canceled")
		default:
			n, err := resp.Body.Read(buf)
			if err != nil && err != io.EOF {
				return fmt.Errorf("canceled")
			}
			if n == 0 {
				return nil
			}

			if _, err := out.Write(buf[:n]); err != nil {
				return fmt.Errorf("ошибка записи в файл: %v", err)
			}
			duration := time.Since(startTime).Seconds()
			speed := float64(prPos) / duration / 1024.0 / 1024.0
			prPos += len(buf[:n])

			if prPos/1024/1024 > predPos/1024/1024 {
				callback(int64(prPos/1024/1024), resp.ContentLength/1024/1024, speed)
			}

			predPos = prPos

		}
	}
}

func RetrieveRunCommand(gameProfileID int) ([]string, error) {
	response, err := GET(S3StorageBaseUrl+fmt.Sprintf("/%d/run.json", gameProfileID), Dict{})
	if err != nil {
		return []string{}, err
	}
	var unmarshalledResponse []string
	err = json.Unmarshal(response, &unmarshalledResponse)
	return unmarshalledResponse, nil
}

func RequestMinecraftUserData(accessToken string) (MinecraftDataResponse, error) {
	response, err := GET(BaseUrl+"/game/launcher", Dict{"Authorization": fmt.Sprintf("Bearer %s", accessToken)})
	if err != nil {
		return MinecraftDataResponse{}, err
	}
	var unmarshalledResponse MinecraftDataResponse
	err = json.Unmarshal(response, &unmarshalledResponse)
	return unmarshalledResponse, nil
}
