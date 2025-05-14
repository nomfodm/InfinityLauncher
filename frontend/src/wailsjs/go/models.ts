export namespace main {
	
	export class Manifest {
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new Manifest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	    }
	}
	export class MinecraftServer {
	    ip: string;
	    port: number;
	
	    static createFrom(source: any = {}) {
	        return new MinecraftServer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.port = source["port"];
	    }
	}
	export class GameProfile {
	    id: number;
	    name: string;
	    title: string;
	    description: string;
	    version: string;
	    cardImgUrl: string;
	    pageBackgroundImgUrl: string;
	    minecraftServer: MinecraftServer;
	    manifest: Manifest;
	
	    static createFrom(source: any = {}) {
	        return new GameProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.version = source["version"];
	        this.cardImgUrl = source["cardImgUrl"];
	        this.pageBackgroundImgUrl = source["pageBackgroundImgUrl"];
	        this.minecraftServer = this.convertValues(source["minecraftServer"], MinecraftServer);
	        this.manifest = this.convertValues(source["manifest"], Manifest);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GameProfileConfig {
	    ram: number;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new GameProfileConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ram = source["ram"];
	        this.path = source["path"];
	    }
	}
	export class LauncherConfig {
	    closeOnGameStart: boolean;
	
	    static createFrom(source: any = {}) {
	        return new LauncherConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.closeOnGameStart = source["closeOnGameStart"];
	    }
	}
	
	export class MinecraftCredential {
	    username: string;
	    uuid: number[];
	
	    static createFrom(source: any = {}) {
	        return new MinecraftCredential(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.uuid = source["uuid"];
	    }
	}
	
	export class Textures {
	    skinHash?: string;
	    capeHash?: string;
	
	    static createFrom(source: any = {}) {
	        return new Textures(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skinHash = source["skinHash"];
	        this.capeHash = source["capeHash"];
	    }
	}
	export class User {
	    id: number;
	    username: string;
	    email: string;
	    active: boolean;
	    // Go type: time
	    registeredAt: any;
	    textures: Textures;
	    minecraftCredential: MinecraftCredential;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.email = source["email"];
	        this.active = source["active"];
	        this.registeredAt = this.convertValues(source["registeredAt"], null);
	        this.textures = this.convertValues(source["textures"], Textures);
	        this.minecraftCredential = this.convertValues(source["minecraftCredential"], MinecraftCredential);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace types {
	
	export class PlayerSample {
	    UUID: string;
	    Name: string;
	
	    static createFrom(source: any = {}) {
	        return new PlayerSample(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.UUID = source["UUID"];
	        this.Name = source["Name"];
	    }
	}
	export class PlayerCount {
	    Online: number;
	    Max: number;
	
	    static createFrom(source: any = {}) {
	        return new PlayerCount(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Online = source["Online"];
	        this.Max = source["Max"];
	    }
	}
	export class PingResponse {
	    Latency: number;
	    PlayerCount: PlayerCount;
	    Protocol: number;
	    Favicon: string;
	    Motd: string;
	    Version: string;
	    Sample: PlayerSample[];
	
	    static createFrom(source: any = {}) {
	        return new PingResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Latency = source["Latency"];
	        this.PlayerCount = this.convertValues(source["PlayerCount"], PlayerCount);
	        this.Protocol = source["Protocol"];
	        this.Favicon = source["Favicon"];
	        this.Motd = source["Motd"];
	        this.Version = source["Version"];
	        this.Sample = this.convertValues(source["Sample"], PlayerSample);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

