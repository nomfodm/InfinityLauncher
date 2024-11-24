import {HadSession, Login, Logout, Me, Refresh} from "../wailsjs/go/main/Auth";
import store from "../store";
import {authing, login, logout, setAuthError} from "../store/auth";

class AuthService {
    async checkAuth() {
        if (await HadSession()) {
            const refreshResult = await this.refresh()
            if (refreshResult) {
                await this.me()
            }
        }
    }

    async login(username: string, password: string): Promise<boolean> {
        store.dispatch(authing())
        await new Promise(resolve => {
            setTimeout(resolve, 400)
        })
        try {
            const accessToken = await Login(username, password)
            localStorage.setItem("token", accessToken)
            await this.me()

            return true
        } catch (e) {
            store.dispatch(logout())
            store.dispatch(setAuthError(e as string))
        }

        return false
    }

    async logout() {
        store.dispatch(logout())
        await Logout()
    }

    async refresh(): Promise<boolean> {
        try {
            const accessToken = await Refresh()
            localStorage.setItem("token", accessToken)

            return true
        } catch (e) {
            store.dispatch(logout())
            console.log(e)
            await this.logout()

            return false
        }


    }

    async me() {
        const accessToken = localStorage.getItem("token")
        if (!accessToken) {
            return
        }
        try {
            const user = await Me(accessToken)
            store.dispatch(login(user))
        } catch (e) {
            console.log(e)
            const refreshResult = await this.refresh()
            if (refreshResult) {
                await this.me()
            }
        }
    }
}

export default new AuthService()