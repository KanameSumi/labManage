import { createTheme } from "@mui/material";

export const defaultTheme = createTheme({
    breakpoints: {
        values: {
            mobile: 0,
            desktop: 600,
        },
    },
    palette: {
        primary: {
            main: "#2a7471",
        },
    },
});