import {RetrieveGameProfiles} from "../wailsjs/go/main/GameProfiler";
import store from "../store";
import {setGameProfiles, setGameProfilesError} from "../store/gameprofiles";

class GameProfiler {
    async retrieve() {
        try {
            const profiles = await RetrieveGameProfiles();
            store.dispatch(setGameProfiles(profiles));
        } catch (e) {
            store.dispatch(setGameProfilesError(e as string));
        }
    }
}

export default new GameProfiler();