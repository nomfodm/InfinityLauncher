import styles from "./MainPage.module.css";
import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import {useDisclosure} from "@mantine/hooks";
import {useNavigate} from "react-router-dom";
import LoginModal from "../../components/LoginModal/LoginModal";

import {useAppSelector} from "../../store/hooks";

export default function MainPage() {
    const auth = useAppSelector((state) => state.auth);

    const [loginOpened, loginHandlers] = useDisclosure();

    const navigate = useNavigate();

    async function handleLoginBtn() {
        loginHandlers.open();
    }

    function handlePlayBtn() {
        navigate("/play");
    }

    return (
        <AnimatedPage>
            <main className={styles.main}>
                <div className={styles.content}>
                    <h2 className={styles.infinity_title}>Infinity</h2>
                    <h4 className={styles.infinity_subtitle}>Бесконечен. Всегда.</h4>

                    <div className={styles.main_page_text}>
                        Идеальные сервера для бесконечного
                        <br/>и безудержного веселья!
                    </div>

                    {auth.authed ? (
                        <button
                            onClick={handlePlayBtn}
                            className={`${styles.button} ${styles.play}`}
                        >
                            Играть
                        </button>
                    ) : (
                        <button
                            onClick={handleLoginBtn}
                            className={`${styles.button} ${styles.login}`}
                        >
                            Войти
                        </button>
                    )}
                </div>
                <LoginModal close={loginHandlers.close} opened={loginOpened}/>
            </main>
        </AnimatedPage>
    );
}
