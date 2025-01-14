package main

import (
	"archive/zip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
)

var (
	filesJsonS3Location = S3StorageBaseUrl + "/%d/files.json"
)

type FileStructurePart struct {
	SHA256 string `json:"sha256"`
}

type FileStructureHashInfo struct {
	Assets    FileStructurePart `json:"assets"`
	Libraries FileStructurePart `json:"libraries"`
	Mods      FileStructurePart `json:"mods"`
	Runtime   FileStructurePart `json:"runtime"`
	Versions  FileStructurePart `json:"versions"`
}

type FileStructureDamage struct {
	AssetsDamaged    bool `json:"assetsDamaged"`
	LibrariesDamaged bool `json:"librariesDamaged"`
	ModsDamaged      bool `json:"modsDamaged"`
	RuntimeDamaged   bool `json:"runtimeDamaged"`
	VersionsDamaged  bool `json:"versionsDamaged"`
}

func FetchGameFilesInfo(gameProfileID int) (FileStructureHashInfo, error) {
	response, err := GET(fmt.Sprintf(filesJsonS3Location, gameProfileID), StringMap{})
	if err != nil {
		return FileStructureHashInfo{}, err
	}

	var gameFilesInfo FileStructureHashInfo
	err = json.Unmarshal(response, &gameFilesInfo)
	if err != nil {
		return gameFilesInfo, err
	}

	return gameFilesInfo, nil
}

func GetGameClientFoldersPaths(profileID int, fileSuffix string) (string, string, string, string, string, error) {
	fs := NewFS()
	gameClientFolderPath, err := fs.GetGameProfilePath(profileID)
	if err != nil {
		return "", "", "", "", "", err
	}

	assetsPath := path.Join(gameClientFolderPath, "assets"+fileSuffix)
	librariesPath := path.Join(gameClientFolderPath, "libraries"+fileSuffix)
	modsPath := path.Join(gameClientFolderPath, "mods"+fileSuffix)
	runtimePath := path.Join(gameClientFolderPath, "runtime"+fileSuffix)
	versionsPath := path.Join(gameClientFolderPath, "versions"+fileSuffix)
	return assetsPath, librariesPath, modsPath, runtimePath, versionsPath, nil
}

func CheckGameFilesIntegrity(profileID int, filesInfoFromServer FileStructureHashInfo) (FileStructureDamage, error) {
	var gameFileStructureDamage FileStructureDamage

	fs := NewFS()
	gameClientFolderPath, err := fs.GetGameProfilePath(profileID)
	if err != nil {
		return gameFileStructureDamage, err
	}

	err = fs.MkDirAll(gameClientFolderPath)
	if err != nil {
		return gameFileStructureDamage, err
	}

	assetsPath, librariesPath, modsPath, runtimePath, versionsPath, err := GetGameClientFoldersPaths(profileID, "")
	if err != nil {
		return gameFileStructureDamage, err
	}

	assetsInfo, _, _ := HashDir(assetsPath)
	librariesInfo, _, _ := HashDir(librariesPath)
	modsInfo, _, _ := HashDir(modsPath)
	runtimeInfo, _, _ := HashDir(runtimePath)
	versionsInfo, _, _ := HashDir(versionsPath)

	if assetsInfo != filesInfoFromServer.Assets.SHA256 {
		gameFileStructureDamage.AssetsDamaged = true
	}

	if librariesInfo != filesInfoFromServer.Libraries.SHA256 {
		gameFileStructureDamage.LibrariesDamaged = true
	}

	if modsInfo != filesInfoFromServer.Mods.SHA256 {
		gameFileStructureDamage.ModsDamaged = true
	}

	if runtimeInfo != filesInfoFromServer.Runtime.SHA256 {
		gameFileStructureDamage.RuntimeDamaged = true
	}

	if versionsInfo != filesInfoFromServer.Versions.SHA256 {
		gameFileStructureDamage.VersionsDamaged = true
	}

	return gameFileStructureDamage, nil
}

func DeleteDamagedParts(profileID int, damage FileStructureDamage) error {
	assetsPath, librariesPath, modsPath, runtimePath, versionsPath, err := GetGameClientFoldersPaths(profileID, "")
	if err != nil {
		return err
	}

	if damage.AssetsDamaged {
		err := os.RemoveAll(assetsPath)
		if err != nil {
			return err
		}
	}

	if damage.LibrariesDamaged {
		err := os.RemoveAll(librariesPath)
		if err != nil {
			return err
		}
	}

	if damage.ModsDamaged {
		err := os.RemoveAll(modsPath)
		if err != nil {
			return err
		}
	}

	if damage.VersionsDamaged {
		err := os.RemoveAll(versionsPath)
		if err != nil {
			return err
		}
	}

	if damage.RuntimeDamaged {
		err := os.RemoveAll(runtimePath)
		if err != nil {
			return err
		}
	}
	return nil
}

func ExtractNecessaryParts(cancelCtx context.Context, profileID int, damage FileStructureDamage, callback func(filename string, size float64, value int64, total int64)) error {
	fs := NewFS()
	gameClientFolderPath, err := fs.GetGameProfilePath(profileID)
	if err != nil {
		return err
	}
	assetsZipPath, librariesZipPath, modsZipPath, runtimeZipPath, versionsZipPath, err := GetGameClientFoldersPaths(profileID, ".zip")
	if err != nil {
		return err
	}

	if damage.AssetsDamaged {
		err := Unzip(cancelCtx, assetsZipPath, gameClientFolderPath, callback)
		if err != nil {
			return err
		}
	}

	if damage.LibrariesDamaged {
		err := Unzip(cancelCtx, librariesZipPath, gameClientFolderPath, callback)
		if err != nil {
			return err
		}
	}

	if damage.ModsDamaged {
		err := Unzip(cancelCtx, modsZipPath, gameClientFolderPath, callback)
		if err != nil {
			return err
		}
	}

	if damage.VersionsDamaged {
		err := Unzip(cancelCtx, versionsZipPath, gameClientFolderPath, callback)
		if err != nil {
			return err
		}
	}

	if damage.RuntimeDamaged {
		err := Unzip(cancelCtx, runtimeZipPath, gameClientFolderPath, callback)
		if err != nil {
			return err
		}
	}
	return nil
}

func Unzip(cancelCtx context.Context, zipPath string, dest string, callback func(filename string, size float64, value int64, total int64)) error {
	zipFileForInfo, err := os.Open(zipPath)
	if err != nil {
		return err
	}
	defer zipFileForInfo.Close()

	zipFileInfo, err := zipFileForInfo.Stat()
	if err != nil {
		return err
	}

	zipFile, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	var value int64 = 0

	for _, file := range zipFile.File {
		select {
		case <-cancelCtx.Done():
			return fmt.Errorf("unzip canceled")
		default:
			callback(file.Name, float64(file.FileInfo().Size())/1024/1024, value/1024/1024, zipFileInfo.Size()/1024/1024)

			filePath := filepath.Join(dest, file.Name)

			fileInfo := file.FileInfo()
			value += fileInfo.Size()

			if file.FileInfo().IsDir() {
				if err := os.MkdirAll(filePath, os.ModePerm); err != nil {
					return err
				}
				continue
			}

			if err := os.MkdirAll(filepath.Dir(filePath), os.ModePerm); err != nil {
				return err
			}

			rc, err := file.Open()
			if err != nil {
				return err
			}

			outFile, err := os.Create(filePath)
			if err != nil {
				rc.Close()
				return err
			}

			_, err = io.Copy(outFile, rc)

			outFile.Close()
			rc.Close()

			if err != nil {
				return err
			}
		}

	}

	return nil
}

func CleanUp(profileID int, damage FileStructureDamage) error {
	assetsZipPath, librariesZipPath, modsZipPath, runtimeZipPath, versionsZipPath, err := GetGameClientFoldersPaths(profileID, ".zip")
	if err != nil {
		return err
	}

	if damage.AssetsDamaged {
		err := os.RemoveAll(assetsZipPath)
		if err != nil {
			return err
		}
	}

	if damage.LibrariesDamaged {
		err := os.RemoveAll(librariesZipPath)
		if err != nil {
			return err
		}
	}

	if damage.ModsDamaged {
		err := os.RemoveAll(modsZipPath)
		if err != nil {
			return err
		}
	}

	if damage.VersionsDamaged {
		err := os.RemoveAll(versionsZipPath)
		if err != nil {
			return err
		}
	}

	if damage.RuntimeDamaged {
		err := os.RemoveAll(runtimeZipPath)
		if err != nil {
			return err
		}
	}
	return nil
}
