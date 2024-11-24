import {MantineSize, StyleProp, Text, useMantineTheme} from "@mantine/core";

export default function InfinitySpanText({fz} : {fz?: StyleProp<number | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | MantineSize | string> | undefined}) {
    const theme = useMantineTheme()
    return <Text span ff={"Montserrat Alternates, " + theme.fontFamily} fw={"bold"} fz={fz}>Infinity</Text>
}