
import styles from "./SimplifiedHeader.module.css";

export default function SimplifiedHeaderWithoutLink() {
    return (
        <header className={`${styles.header}`}>
            <span className={styles.logo_title}>
                Infinity
            </span>
        </header>
    );
}
