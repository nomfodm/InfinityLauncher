import {Link, useLocation} from "react-router-dom";
import styles from "./Header.module.css";
import {useEffect, useState,} from "react";

const links = [
    {location: "/", name: "Главная"},
    {location: "/play", name: "Играть"}
]

const links_locations = ["/", "/play"] // scroll fix

export default function Header() {
    const [blurred, setBlurred] = useState(false);
    const location = useLocation();
    const pathname = location.pathname;

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    function handleScroll(event: any) {
        if (!links_locations.includes(pathname)) {
            return
        }
        const target = event.target;
        const position = target.scrollTop;

        if (position! > 5) {
            setBlurred(true);
        } else {
            setBlurred(false);
        }
    }

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, []);

    function isLinkActive(path: string) {
        if (pathname === path) {
            return styles.active;
        }

        return "";
    }

    return (
        <>
            <header className={`${styles.header} ${blurred && styles.bg_blurred}`}>
                <Link draggable={false} to={"/"} className={styles.logo_title}>
                    Infinity
                </Link>
                <ul className={styles.navbar}>
                    {links.map((item, i) => {
                        return (
                            <li key={i}>
                                <Link draggable={false} className={isLinkActive(item.location)} to={item.location}>
                                    {item.name}
                                </Link>
                            </li>
                        )
                    })}

                    {/*<li>*/}
                    {/*  <Link*/}
                    {/*    draggable={false}*/}
                    {/*    className={isLinkActive("/news")}*/}
                    {/*    to={"/news"}*/}
                    {/*  >*/}
                    {/*    Новости*/}
                    {/*  </Link>*/}
                    {/*</li>*/}
                    {/*<li>*/}
                    {/*    <Link*/}
                    {/*        draggable={false}*/}
                    {/*        className={isLinkActive("/play")}*/}
                    {/*        to={"/play"}*/}
                    {/*    >*/}
                    {/*        Играть*/}
                    {/*    </Link>*/}
                    {/*</li>*/}
                </ul>
            </header>
        </>
    );
}
