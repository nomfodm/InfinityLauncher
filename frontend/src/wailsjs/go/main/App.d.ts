// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';

export function CheckForUpdates():Promise<boolean>;

export function CheckGameFilesIntegrity(arg1:number,arg2:main.FileStructureHashInfo):Promise<main.FileStructureDamage>;

export function CleanUp(arg1:number,arg2:main.FileStructureDamage):Promise<void>;

export function DeleteDamagedParts(arg1:number,arg2:main.FileStructureDamage):Promise<void>;

export function DownloadFile(arg1:string,arg2:string):Promise<void>;

export function DownloadNecessaryParts(arg1:number,arg2:main.FileStructureDamage):Promise<void>;

export function ExtractNecessaryParts(arg1:number,arg2:main.FileStructureDamage):Promise<void>;

export function FetchGameFilesInfo(arg1:number):Promise<main.FileStructureHashInfo>;

export function GetVersion():Promise<string>;

export function Init():Promise<void>;

export function OpenDirectoryDialog(arg1:string):Promise<string>;

export function Play(arg1:number,arg2:string):Promise<void>;

export function PlayWithoutAccount(arg1:number):Promise<void>;

export function RestartApp():Promise<void>;

export function Update():Promise<void>;
