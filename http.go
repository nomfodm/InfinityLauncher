package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

var (
	connectionTestS3Url = S3StorageBaseUrl + "/checkConnection"
)

var (
	ErrConnectionFailed = errors.New("не удалось подключиться к серверам Infinity")
	ErrServerIsDown     = errors.New("сервера отключены, возможно проводятся тех.работы")
)

func GET[T any](url string, headers StringMap) (T, error) {
	var a T

	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return a, err
	}
	for key, value := range headers {
		request.Header.Add(key, value)
	}

	response, err := doHttpRequest(request)
	if err != nil {
		return a, err
	}
	defer response.Body.Close()

	responseBody, err := processResponseBody[T](response)
	return responseBody, err
}

func POST[T any](url string, requestBody StringMap, headers StringMap) (T, error) {
	var a T

	requestBodyJsonMarshalled, _ := json.Marshal(requestBody)

	request, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBodyJsonMarshalled))
	if err != nil {
		return a, err
	}
	request.Header.Add("Content-Type", "application/json")
	for key, value := range headers {
		request.Header.Add(key, value)
	}

	response, err := doHttpRequest(request)
	if err != nil {
		return a, err
	}
	defer response.Body.Close()

	responseBody, err := processResponseBody[T](response)
	return responseBody, err
}

func doHttpRequest(request *http.Request) (*http.Response, error) {
	client := &http.Client{
		Timeout: 3 * time.Second,
	}
	response, err := client.Do(request)
	// response.Body need to be closed in parent function

	return response, err
}

func processResponseBody[T any](response *http.Response) (T, error) {
	var responseBodyUnmarshalled T

	responseBody, _ := io.ReadAll(response.Body)
	if response.StatusCode != 200 {
		var responseBodyJsonError ErrorResponse
		err := json.Unmarshal(responseBody, &responseBodyJsonError)
		if err != nil {
			return responseBodyUnmarshalled, err
		}
		return responseBodyUnmarshalled, errors.New(responseBodyJsonError.Detail)
	}

	err := json.Unmarshal(responseBody, &responseBodyUnmarshalled)
	return responseBodyUnmarshalled, err
}

func RequestLogin(username, password string) (string, string, error) {
	response, err := POST[LoginResponse](BaseUrl+"/auth/signin", StringMap{"username": username, "password": password}, StringMap{})
	if err != nil {
		return "", "", err
	}
	return response.AccessToken, response.RefreshToken, nil
}

func RequestRefresh(refreshToken string) (string, string, error) {
	response, err := POST[RefreshResponse](BaseUrl+"/auth/refresh", StringMap{"refreshToken": refreshToken}, StringMap{})
	if err != nil {
		return "", "", err
	}
	return response.AccessToken, response.RefreshToken, nil
}

func RequestLogout(refreshToken string) (string, error) {
	response, err := POST[StatusResponse](BaseUrl+"/auth/logout", StringMap{"refreshToken": refreshToken}, StringMap{})
	if err != nil {
		return "", err
	}
	return response.Status, nil
}

func RequestMe(accessToken string) (User, error) {
	response, err := GET[User](BaseUrl+"/user/me", StringMap{"Authorization": fmt.Sprintf("Bearer %s", accessToken)})
	if err != nil {
		return User{}, err
	}
	return response, nil
}

func RetrieveRunCommand(gameProfileID int) ([]string, error) {
	response, err := GET[[]string](S3StorageBaseUrl+fmt.Sprintf("/%d/run.json", gameProfileID), StringMap{})
	if err != nil {
		return []string{}, err
	}
	return response, nil
}

func RequestMinecraftUserData(accessToken string) (MinecraftDataResponse, error) {
	response, err := GET[MinecraftDataResponse](BaseUrl+"/game/launcher", StringMap{"Authorization": fmt.Sprintf("Bearer %s", accessToken)})
	if err != nil {
		return MinecraftDataResponse{}, err
	}
	return response, nil
}

func RequestLauncherVersionInformation() (LauncherVersionInformation, error) {
	response, err := GET[LauncherVersionInformation](BaseUrl+"/launcher/updates", StringMap{})
	if err != nil {
		return LauncherVersionInformation{}, err
	}
	return response, nil
}

func TestConnection() error {
	s3Response, err := GET[ConnectionTestResponse](connectionTestS3Url, StringMap{})
	if err != nil {
		return ErrConnectionFailed
	}

	if s3Response.Status != "working" {
		return ErrServerIsDown
	}

	backendResponse, err := GET[ConnectionTestResponse](BaseUrl+"/checkConnection", StringMap{})
	if err != nil {
		return ErrConnectionFailed
	}

	if backendResponse.Status != "working" {
		return ErrServerIsDown
	}

	return nil
}
