import { Button } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import styles from "./UserButton.module.css";
import { useAppSelector } from "../../store/hooks";
import { getUserSkinAvatarUrl } from "../../utils/url";

import { Link } from "react-router-dom";

export default function UserButton({ isActive }: { isActive: boolean }) {
  const auth = useAppSelector((state) => state.auth);

  return (
    <Button
      component={Link}
      to="/user"
      className={styles.userbutton}
      data-active={isActive || undefined}
      variant="subtle"
      loading={auth.authing}
      loaderProps={{ size: 20, color: "white" }}
      p={0}
      w={36}
      h={36}
    >
      {auth.authed ? (
        <img
          draggable={false}
          src={getUserSkinAvatarUrl(auth.user!.textures.skinHash)}
          alt=""
          width={24}
          height={24}
        />
      ) : (
        <IconUser size={24} stroke={2} />
      )}
    </Button>
  );
}
